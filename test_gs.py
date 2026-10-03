from googlesearch import search
results = list(search("What is the weather in New York", num_results=3))
print("Basic:", results)
results_adv = list(search("What is the weather in New York", num_results=3, advanced=True))
print("Advanced:", results_adv)
