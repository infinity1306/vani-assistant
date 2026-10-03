import re
from typing import Dict, Callable, Optional, Tuple, Any

class FastIntentEngine:
    """
    Zero-latency, regex/trie-based intent matcher for core system commands.
    Bypasses the LLM entirely for simple hardware/OS macros.
    """
    def __init__(self):
        # Map of regex patterns to (intent_name, extract_params_fn)
        self.patterns: Dict[re.Pattern, Tuple[str, Callable[[re.Match], Dict[str, Any]]]] = {}
        self._register_default_intents()

    def _register_default_intents(self):
        # Audio / Volume — English
        self.register(r"mute (system|audio|volume)|shut up", "volume_mute")
        self.register(r"unmute (system|audio|volume)|speak", "volume_unmute")
        self.register(r"set volume (to )?(?P<level>\d+)( percent|%)?", "volume_set", lambda m: {"level": int(m.group("level"))})
        self.register(r"volume (up|down)", "volume_adjust", lambda m: {"direction": m.group(1)})
        self.register(r"volume (?P<level>\d+)", "volume_set", lambda m: {"level": int(m.group("level"))})

        # Audio / Volume — Hinglish
        self.register(r"volume (badhao|badha do)", "volume_adjust", lambda m: {"direction": "up"})
        self.register(r"volume (kam karo|kam kar do|ghata do)", "volume_adjust", lambda m: {"direction": "down"})
        self.register(r"awaaz (band|mute) (karo|kar do)", "volume_mute")
        self.register(r"awaaz (chalu|on) (karo|kar do)", "volume_unmute")

        # Display — English + Hinglish
        self.register(r"(set )?brightness (to )?(?P<level>\d+)( percent|%)?", "brightness_set", lambda m: {"level": int(m.group("level"))})
        self.register(r"brightness (?P<level>\d+)", "brightness_set", lambda m: {"level": int(m.group("level"))})
        self.register(r"brightness (badhao|badha do|increase)", "brightness_adjust", lambda m: {"direction": "up"})
        self.register(r"brightness (kam karo|kam kar do|decrease|reduce)", "brightness_adjust", lambda m: {"direction": "down"})

        # Media — English + Hinglish
        self.register(r"^(play|pause) media$|^pause$|^play$|^resume$", "media_play_pause")
        self.register(r"^(next (track|song)|skip)$", "media_next")
        self.register(r"previous (track|song)", "media_prev")
        self.register(r"gaana (bajao|play karo|chalu karo)", "media_play_pause")
        self.register(r"agla gaana|next gaana", "media_next")

        # Windows & Apps — English + Hinglish
        self.register(r"close (the |this )?(window|app|application)", "window_close")
        self.register(r"minimize (the |this )?(window|app)", "window_minimize")
        self.register(r"take (a )?screenshot", "screenshot_capture")
        self.register(r"(window |app )?(band karo|band kar do)", "window_close")
        self.register(r"scroll (?P<direction>up|down)", "window_scroll", lambda m: {"direction": m.group("direction")})
        self.register(r"(upar|neeche) scroll (karo|kar do)", "window_scroll", lambda m: {"direction": "up" if m.group(1) == "upar" else "down"})

        # App Control — English + Hinglish
        self.register(r"open (?P<app>.+)", "open_app", lambda m: {"app": m.group("app")})
        self.register(r"(?P<app>\S+) (kholo|kholdo|kholna|open karo)", "open_app", lambda m: {"app": m.group("app")})
        self.register(r"close (?P<app>.+)", "close_app", lambda m: {"app": m.group("app")})
        self.register(r"(?P<app>\S+) (band karo|close karo|band kardo)", "close_app", lambda m: {"app": m.group("app")})

        # Web Search — English + Hinglish
        prefixes_opt = r"^(?:(?:hey |hi )?(?:jarvis|vani)[,\s]*)?"
        self.register(prefixes_opt + r"(?:search|google|look up|tell me about|ask about|what is) (?:for )?(?P<query>.+)", "web_search", lambda m: {"query": m.group("query")})
        self.register(prefixes_opt + r"(?P<query>.+?) (?:search karo|google karo|dhundho|ke bare mein batao)$", "web_search", lambda m: {"query": m.group("query")})
        self.register(prefixes_opt + r"play (?P<query>.+)$", "web_search", lambda m: {"query": m.group("query") + " on youtube"})

        # Vision / Face Detection — English + Hinglish
        self.register(r"scan (the |for )?(room|area|surroundings)", "vision_scan", lambda m: {"duration": 5})
        self.register(r"(who('?s| is) (there|here|around)|anyone (there|here|around))", "vision_scan", lambda m: {"duration": 5})
        self.register(r"(check|look) for (faces|people|humans|someone|anyone)", "vision_scan", lambda m: {"duration": 5})
        self.register(r"(face|facial) (scan|detection|check|recognition)", "vision_scan", lambda m: {"duration": 5})
        self.register(r"(kamra|camera) (se )?(dekho|check karo|scan karo)", "vision_scan", lambda m: {"duration": 5})
        self.register(r"(koi hai|kaun hai) (room mein|yahan|wahan)", "vision_scan", lambda m: {"duration": 5})
        self.register(r"take (a )?photo", "vision_capture")
        self.register(r"capture (a )?(photo|image|picture)", "vision_capture")
        self.register(r"(photo|tasveer) (lo|khicho|lelo)", "vision_capture")

        # System — English + Hinglish
        self.register(r"^(?:(?:hey |hi )?(?:jarvis|vani)[,\s]*)?(stop listening|sleep|goodbye|go to sleep)[.!?]*$", "system_sleep")
        self.register(r"^(?:(?:hey |hi )?(?:jarvis|vani)[,\s]*)?(wake up|vani)[.!?]*$", "system_wake")
        self.register(r"^(?:(?:hey |hi )?(?:jarvis|vani)[,\s]*)?(so jao|band ho jao|chup ho jao)[.!?]*$", "system_sleep")
        self.register(r"^(?:(?:hey |hi )?(?:jarvis|vani)[,\s]*)?((let's|start) chat(ting)?|continuous mode|keep listening)[.!?]*$", "continuous_mode_on")
        self.register(r"^(?:(?:hey |hi )?(?:jarvis|vani)[,\s]*)?(mujhse baat karo|baat karein|lagaatar suno)[.!?]*$", "continuous_mode_on")
        anant_variants = r"(anant|anand|ananth|unant|anan|arnant|ananda)"
        shivi_variants = r"(shivi|sheevee|shivvy|she we|c b|cv|shiv e|shivie|shiv i|she vi|shi vi)"
        shiwani_variants = r"(shiwani|shivani|she wani|shiva ni|shi wani|sea wani|siwani|shibani|shivni|shiwa ni)"
        anshuman_variants = r"(anshuman|ansh man|and shuman|an shoe man|unshuman|un show man|on shoe man|anshun|an shuman|an suman|ansuman|aunt shuman|unsummon|un summon|and human)"
        prefixes = r"(mai|main|i am|i'm|my name is|this is|yeh)"
        
        self.register(r"^(?:(?:hey |hi )?(?:jarvis|vani)[,\s]*)?" + prefixes + r"\s+" + anant_variants + r"[.!?]*$", "secret_vault_unlock")
        self.register(r"^(?:(?:hey |hi )?(?:jarvis|vani)[,\s]*)?" + prefixes + r"\s+(" + shivi_variants + r"|" + shiwani_variants + r")[.!?]*$", "shivi_arrival")
        self.register(r"^(?:(?:hey |hi )?(?:jarvis|vani)[,\s]*)?" + prefixes + r"\s+" + anshuman_variants + r"[.!?]*$", "anshuman_arrival")

        # Time & Date
        self.register(r"what time is it|tell me( the)? time|current time|what('?s| is)( the)? time|time kya hai|time b(a|t)+[ao]+( do)?|time bta(a)?( do)?", "get_time")
        self.register(r"kya time (hua|ho raha) hai", "get_time")
        self.register(r"what date( is)? it( is)?|what('?s| is)( the)? date|what is today('?s)? date|tell me( the)? date|current date|aaj kya date hai|date batao|aaj (ki )?date", "get_date")
        self.register(r"aaj kya (taareekh|tareekh|din) hai|taareekh batao", "get_date")

        # Weather
        self.register(r"weather( today| report)?|what('?s| is)( the)? weather|how('?s| is)( the)? weather", "get_weather")
        self.register(r"mausam (kaisa hai|batao|btaa|bta do)|weather b(a|t)+[ao]+( do)?|weather bta(a)?( do)?", "get_weather")

    def register(self, pattern: str, intent_name: str, extractor: Callable[[re.Match], Dict[str, Any]] = lambda m: {}):
        """Register a regex pattern to an intent."""
        compiled = re.compile(pattern, re.IGNORECASE)
        self.patterns[compiled] = (intent_name, extractor)

    def match(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Attempts to match the transcript against fast-path intents.
        Returns a dict with 'intent' and 'params' if matched, else None.
        """
        text = text.strip().lower()
        for pattern, (intent_name, extractor) in self.patterns.items():
            match = pattern.search(text)
            if match:
                try:
                    params = extractor(match)
                    return {"intent": intent_name, "params": params}
                except Exception as e:
                    print(f"[FastIntent] Error extracting params for {intent_name}: {e}")
                    pass
                    
        # Only apply very specific fallbacks
        if "screenshot" in text:
            return {"intent": "screenshot_capture", "params": {}}
            
        return None

if __name__ == "__main__":
    # Test
    engine = FastIntentEngine()
    print(engine.match("set volume to 50 percent"))
    print(engine.match("next song"))
    print(engine.match("write a python script to sort a list")) # Should return None
