import requests, re
s = requests.Session()
HEADERS = {'User-Agent':'Mozilla/5.0'}
r = s.get('https://www.evasolo.com/sitemap.xml', headers=HEADERS, timeout=30)
print(f'Top sitemap status={r.status_code} len={len(r.text)}')
# Find sub-sitemaps
sitemaps = re.findall(r'<sitemap>.*?<loc>([^<]+)</loc>', r.text, re.DOTALL)
print(f'Sub-sitemaps found: {len(sitemaps)}')
for sm in sitemaps[:20]:
    print(f'  {sm}')

# If empty, check for direct urls
urls = re.findall(r'<loc>([^<]+)</loc>', r.text)
print(f'\nTotal <loc> tags: {len(urls)}')

# Look for urls containing SKU-like patterns or product detail patterns
# Sample some that look like product detail pages
detail_like = [u for u in urls if u.count('/') >= 6]
print(f'URLs with >=6 path segments (likely product details): {len(detail_like)}')
for u in detail_like[:10]:
    print(f'  {u}')
