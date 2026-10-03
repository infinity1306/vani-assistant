import urllib.request, urllib.parse
query = "What is the weather in New York"
url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(query)
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
with urllib.request.urlopen(req) as response:
    print(response.read().decode('utf-8')[:500])
