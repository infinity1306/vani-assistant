import os
import asyncio
import json
from dotenv import load_dotenv
from openai import AsyncOpenAI

async def test_resolve():
    load_dotenv()
    key = os.getenv("OPENAI_API_KEY")
    print(f"API Key found: {'Yes' if key else 'No'}")
    if key:
        print(f"Key preview: {key[:10]}...")
        
    client = AsyncOpenAI(api_key=key)
    
    system_prompt = """
    You are a senior AI systems architect and Python engineer.
    Return JSON format:
    {
        "intent": "primary_intent",
        "confidence": 0-100,
        "tasks": [
            {
                "step": 1,
                "action": "open_application",
                "target": "chrome",
                "parameters": {}
            }
        ]
    }
    """
    
    transcript = "open chrome"
    print(f"Testing transcript: '{transcript}'")
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Transcript: '{transcript}'"}
            ],
            response_format={ "type": "json_object" },
            temperature=0.0,
        )
        content = response.choices[0].message.content
        print(f"Response Content: {content}")
        parsed = json.loads(content)
        print(f"Parsed Successfully: {parsed}")
    except Exception as e:
        print(f"Error during OpenAI call: {e}")

if __name__ == "__main__":
    asyncio.run(test_resolve())
