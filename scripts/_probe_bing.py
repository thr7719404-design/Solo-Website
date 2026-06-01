"""Probe Bing search for evasolo SKUs."""
import requests
import re

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept': 'text/html,*/*',
    'Accept-Language': 'en-US,en;q=0.5',
}

test_skus = ['567430', '567435', '530555', '202090', '503042']

for sku in test_skus:
    print(f'\n=== SKU {sku} ===', flush=True)
    for q in [f'site:evasolo.com {sku}', f'evasolo {sku}']:
        try:
            r = requests.get('https://www.bing.com/search', params={'q': q}, headers=HEADERS, timeout=15)
            urls = re.findall(r'https?://(?:www\.)?evasolo\.com[^"\'<>\s)]+', r.text)
            urls = list(dict.fromkeys(urls))[:5]
            print(f'  q="{q}" status={r.status_code} evasolo_urls={len(urls)}', flush=True)
            for u in urls[:5]:
                print(f'    -> {u}', flush=True)
            if urls:
                break
        except Exception as e:
            print(f'  err: {e}', flush=True)
