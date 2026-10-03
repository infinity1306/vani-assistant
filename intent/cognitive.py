import asyncio
import aiohttp
import json
import re
from typing import Dict, Any, Optional
import os
import logging

logger = logging.getLogger("VANI-Cognitive")

class CognitiveEngine:
    """
    Interfaces with a local Ollama instance for complex intent resolution.
    Runs llama3.2:1b for fast classification/conversational routing,
    and escalates to deepseek-r1:8b for heavy reasoning.
    """
    def __init__(self, router_model: str = "llama3.2:1b", chat_model: str = "gemma2:9b", coder_model: str = "deepseek-r1:8b",
                 host: str = "http://127.0.0.1:11434", num_ctx: int = 2048, num_predict: int = 256,
                 timeout: float = 60.0):
        self.router_model = os.getenv("OLLAMA_ROUTER_MODEL", router_model)
        self.chat_model = os.getenv("OLLAMA_CHAT_MODEL", chat_model)
        self.coder_model = os.getenv("OLLAMA_CODER_MODEL", coder_model)
        self.host = host
        self.api_url = f"{self.host}/api/generate"
        self.num_ctx = num_ctx
        self.num_predict = num_predict
        self.timeout = timeout
        
        # System prompt for structured intent parsing
        self.system_prompt = (
            "You are a routing agent for the VANI voice assistant. "
            "The user is speaking Indian English (Hinglish) into a speech-to-text engine. "
            "CRITICAL: You MUST silently correct phonetic misspellings and STT hallucinations (e.g., 'stark market' -> 'stock market', 'opan krome' -> 'open chrome') BEFORE routing. "
            "Never assume weird phonetically spelled words are computer applications. Convert phonetic nonsense into logical intents. "
            "Given the user's input, classify it into one of the following intents and extract the required parameters:\n"
            "- 'volume_set' (params: 'level' as integer)\n"
            "- 'brightness_set' (params: 'level' as integer)\n"
            "- 'volume_mute', 'volume_unmute', 'mic_mute', 'mic_unmute', 'media_play_pause', 'media_next', 'window_close', 'screenshot_capture', 'system_diagnostics'\n"
            "- 'open_app' (params: 'app' as string, e.g. 'camera', 'youtube', 'chrome'). ONLY classify as open_app if the user clearly wants to open software.\n"
            "- 'close_app' (params: 'app' as string). ONLY classify if user wants to close/kill an app.\n"
            "- 'web_search' (params: 'query' as string)\n"
            "- 'generate_code' (if the user asks to write, generate, or explain code, scripts, or programs)\n"
            "- 'heavy_query' (if the user asks complex questions, math, logic, or long explanations)\n"
            "- 'chat' (for general conversation, questions about time/date/tomorrow/yesterday, greetings, basic questions, OR if the input is gibberish, profanity, or meaningless; params: 'response' as a short friendly Hinglish reply)\n\n"
            "CRITICAL RULES:\n"
            "1. DO NOT guess intents. If the user's command is abusive, meaningless, or doesn't clearly match an intent, you MUST classify it as 'chat' and reply appropriately.\n"
            "2. If the user asks a question that requires current real-world knowledge (e.g. news, weather, stock prices, facts, recent events, 'what is tomorrow'), "
            "you MUST set 'search_required' to true and provide a 'search_query' parameter.\n"
            "3. If the input appears to be random background noise (like 'thank you', 'bye', 'you'), classify as 'chat' with an empty response.\n\n"
            "Return a JSON object in this format:\n"
            "{\n"
            "  \"intent\": \"<intent_name>\",\n"
            "  \"search_required\": true/false,\n"
            "  \"search_query\": \"<search string if required, else null>\",\n"
            "  \"params\": { ... }\n"
            "}\n"
            "Output ONLY valid JSON."
        )

    async def _query_ollama(self, model: str, prompt: str, system: str = "", format: str = None, timeout: float = None) -> Optional[str]:
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.1 if format == "json" else 0.7,
                "num_predict": self.num_predict if format == "json" else 256,
                "num_ctx": self.num_ctx
            }
        }
        if format:
            payload["format"] = format
        if system:
            payload["system"] = system

        query_timeout = timeout if timeout is not None else self.timeout
        try:
            timeout_cfg = aiohttp.ClientTimeout(total=query_timeout)
            async with aiohttp.ClientSession(timeout=timeout_cfg) as session:
                async with session.post(self.api_url, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("response", "")
                    else:
                        logger.error(f"Ollama returned status {response.status} for model {model}")
                        return None
        except asyncio.TimeoutError:
            logger.error(f"Ollama timed out for model {model}")
            return None
        except Exception as e:
            logger.error(f"Error communicating with Ollama: {e}")
            return None

    async def resolve_intent(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Queries the lightweight classifier model first, then routes to heavy model if needed.
        """
        logger.info(f"Classifying intent using fast router '{self.router_model}'...")
        prompt = f"{self.system_prompt}\n\nUser: {text}\nJSON:"
        
        response_text = await self._query_ollama(self.router_model, prompt, format="json")
        if not response_text:
            return None

        try:
            intent_data = json.loads(response_text)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse JSON classifier response: {response_text}")
            return None

        intent = intent_data.get("intent", "chat")
        search_required = intent_data.get("search_required", False)
        search_query = intent_data.get("search_query", "")
        
        # Perform Web Search if needed
        web_context = ""
        if search_required and search_query:
            logger.info(f"Router requested internet access. Searching for: '{search_query}'")
            try:
                # We do the import here to avoid circular dependencies if needed
                from core.web_search import search_web
                search_results = await asyncio.to_thread(search_web, search_query)
                web_context = f"\n[INTERNET SEARCH RESULTS FOR '{search_query}']:\n{search_results}\n"
                logger.info("Internet search completed.")
            except ImportError:
                logger.warning("web_search module not found. Skipping internet access.")
            except Exception as e:
                logger.error(f"Web search execution failed: {e}")

        # Route to heavy reasoning model for coding/logic
        if intent in ("heavy_query", "generate_code"):
            logger.info(f"Routing to Coder/Heavy model '{self.coder_model}'...")
            
            heavy_system = (
                "You are VANI, a female intelligent AI assistant. "
                "Provide a clear, high-quality response in friendly Hinglish (Hindi written in English alphabet). "
                "CRITICAL: You MUST use female pronouns and verb endings when referring to yourself (e.g. 'Main kar rahi hoon', 'Main samajh gayi' instead of 'raha hoon'). "
                "If asked to write code, provide the code with comments explaining it."
            ) + web_context
            
            heavy_response = await self._query_ollama(
                self.coder_model, 
                text, 
                system=heavy_system,
                timeout=120.0
            )
            
            if heavy_response:
                # Strip out deepseek thinking blocks
                cleaned_response = re.sub(r"<think>.*?</think>", "", heavy_response, flags=re.DOTALL).strip()
                intent_data = {
                    "intent": "chat",
                    "params": {"response": cleaned_response}
                }
            else:
                intent_data = {"intent": "chat", "params": {"response": "Sorry sir, heavy reasoning fail ho gaya."}}

        # Route to conversational model if it's chat but requires external info or a better conversational flow
        VALID_INTENTS = {
            "volume_set", "volume_mute", "volume_unmute", "mic_mute", "mic_unmute", "media_play_pause", "media_next", "media_prev",
            "brightness_set", "brightness_adjust", "window_close", "window_minimize", "window_scroll",
            "screenshot_capture", "system_sleep", "system_wake", "system_diagnostics", "open_app",
            "web_search", "vision_scan", "vision_capture", "get_time", "get_weather"
        }

        # If the model hallucinated an intent not in the strict control list, treat it as chat
        if intent not in VALID_INTENTS and intent not in ("heavy_query", "generate_code", "chat"):
            logger.warning(f"Router hallucinated unknown intent: {intent}. Defaulting to chat.")
            intent = "chat"
            intent_data["intent"] = "chat"
            
        # Hard override to prevent 1B model action hallucinations:
        # If intent is an action but the transcript lacks action verbs, force to chat
        if intent == "open_app" and not any(w in text.lower() for w in ["open", "start", "kholo", "chalu", "app", "find", "search", "dhundho", "folder", "directory"]):
            logger.warning("Overriding hallucinated open_app to chat.")
            intent = "chat"
            intent_data["intent"] = "chat"
            
        if intent == "volume_set" and not any(w in text.lower() for w in ["volume", "awaaz", "sound", "percent"]):
            logger.warning("Overriding hallucinated volume_set to chat.")
            intent = "chat"
            intent_data["intent"] = "chat"

        # Route to conversational model if it's chat but requires external info, has no response, or was hallucinated
        if intent == "chat" and (search_required or not intent_data.get("params", {}).get("response")):
            logger.info(f"Routing to Day-to-Day Chat model '{self.chat_model}'...")
            
            chat_system = (
                "You are VANI, a female helpful assistant. "
                "Reply concisely and warmly in friendly Hinglish (Hindi written in English alphabet). "
                "CRITICAL: You MUST use female pronouns and verb endings when referring to yourself (e.g. 'Main kar rahi hoon', 'Main thik hoon' instead of 'raha hoon')."
            ) + web_context
            
            chat_response = await self._query_ollama(
                self.chat_model, 
                text, 
                system=chat_system,
                timeout=60.0
            )
            
            if chat_response:
                cleaned_response = re.sub(r"<think>.*?</think>", "", chat_response, flags=re.DOTALL).strip()
                intent_data = {
                    "intent": "chat",
                    "params": {"response": cleaned_response}
                }
            else:
                intent_data = {"intent": "chat", "params": {"response": "Sorry sir, chat model connect nahi ho paaya."}}
        
        return intent_data
