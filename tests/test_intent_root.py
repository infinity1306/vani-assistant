import asyncio
import json
import logging
from intent.router import IntentRouter

logging.basicConfig(level=logging.ERROR)

async def main():
    router = IntentRouter()
    
    commands = [
        "Open google chrome",
        "Search youtube for lofi music",
        "Take a screenshot"
    ]
    
    results = {}
    for cmd in commands:
        res = await router.resolve(cmd)
        results[cmd] = res

    with open("intent_output.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    asyncio.run(main())
