import asyncio
from intent.router import IntentRouter

async def test_ollama():
    print("Testing Local Ollama Integration...")
    router = IntentRouter(model="llama3.1")
    
    # Test 1: Simple English Intent
    sentence1 = "open chrome"
    print(f"\n[Test 1] User: '{sentence1}'")
    result1 = await router.resolve(sentence1)
    print(f"Result: {result1}")
    
    # Test 2: Hindi/Hinglish Intent
    sentence2 = "youtube chalao aur usme lofi music search karo"
    print(f"\n[Test 2] User: '{sentence2}'")
    result2 = await router.resolve(sentence2)
    print(f"Result: {result2}")

if __name__ == "__main__":
    asyncio.run(test_ollama())
