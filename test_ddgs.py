from ddgs import DDGS
with DDGS() as ddgs:
    results = list(ddgs.text("What is the weather in New York", max_results=3))
    print(results)
