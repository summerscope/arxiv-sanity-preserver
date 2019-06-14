import argparse
import feedparser
import urllib.request


parser = argparse.ArgumentParser()
parser.add_argument('--search-query', type=str,
                    default='cat:cs.CV+OR+cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:cs.NE+OR+cat:stat.ML',
                    help='query used for arxiv API. See http://arxiv.org/help/api/user-manual#detailed_examples')
parser.add_argument('--start-index', type=int, default=0, help='0 = most recent API result')
parser.add_argument('--results-per-iteration', type=int, default=10, help='passed to arxiv API')

args = parser.parse_args()
query = 'search_query=%s&sortBy=lastUpdatedDate&start=%i&max_results=%i' % \
    (args.search_query, args.start_index, args.results_per_iteration)

base_url = 'http://export.arxiv.org/api/query?' # base api query url

print(base_url+query)
    
with urllib.request.urlopen(base_url+query) as url:
    response = url.read()

parse = feedparser.parse(response)

print("------------")
for e in parse.entries:
    # print(e)
    print(e.title)
    print(", ".join([t.term for t in e.tags]))
    print("")
    print(e.summary)
    print("------------")
