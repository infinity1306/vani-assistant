import logging

logger = logging.getLogger("VANI-WebSearch")

def search_web(query: str, max_results: int = 3) -> str:
    """
    Performs a web search using wikipedia as a reliable fallback.
    Returns a concatenated string of the top snippets.
    """
    logger.info(f"Performing web search for: '{query}'")
    try:
        import wikipedia
        
        # Try to find the closest matching page
        search_results = wikipedia.search(query, results=max_results)
        
        if not search_results:
            return "No internet search results found."
            
        snippets = []
        for i, title in enumerate(search_results):
            try:
                summary = wikipedia.summary(title, sentences=3, auto_suggest=False)
                snippets.append(f"Result {i+1}: {title} - {summary}")
            except wikipedia.exceptions.DisambiguationError as e:
                # If it's ambiguous, just pick the first option
                try:
                    summary = wikipedia.summary(e.options[0], sentences=2, auto_suggest=False)
                    snippets.append(f"Result {i+1}: {e.options[0]} - {summary}")
                except Exception:
                    continue
            except Exception:
                continue
                
        if not snippets:
            return "No internet search results found."
            
        return "\n\n".join(snippets)
        
    except Exception as e:
        logger.error(f"Web search failed: {e}")
        return f"Internet search failed due to error: {e}"
