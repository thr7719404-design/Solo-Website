"""Probe DuckDuckGo HTML search for evasolo SKUs."""
import sys
import requests
import re
from urllib.parse import quote

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept': 'text/html,*/*',
    'Accept-Language': 'en-US,en;q=0.5',
}

# Test SKUs that should exist on evasolo.com
test_skus = ['567430', '567435', '567431', '530555', '530556']

for sku in test_skus:
    print(f'\n=== SKU {sku} ===', flush=True)
    # Try DDG html search
    q = quote(f'site:evasolo.com {sku}')
    url = f'https://html.duckduckgo.com/html/?q={q}'
    try:
        r = requests.post('https://html.duckduckgo.com/html/', data={'q': f'site:evasolo.com {sku}'}, headers=HEADERS, timeout=15)
        print(f'  DDG status={r.status_code} len={len(r.text)}', flush=True)
        # Look for evasolo URLs in the HTML
        urls = re.findall(r'https?://(?:www\.)?evasolo\.com[^"\'<>\s]+', r.text)
        urls = [u for u in urls if 'duckduckgo' not in u][:5]
        for u in urls[:5]:
            print(f'    -> {u}', flush=True)
    except Exception as e:
        print(f'  err: {e}', flush=True)

    # Try DDG for plytix CDN
    try:
        r = requests.post('https://html.duckduckgo.com/html/', data={'q': f'cdn.plytix.com {sku} evasolo'}, headers=HEADERS, timeout=15)
        plytix = re.findall(r'https?://[^"\'<>\s]*plytix[^"\'<>\s]*\.(?:jpg|jpeg|png|webp)', r.text)
        print(f'  plytix URLs: {len(plytix)}', flush=True)
        for u in plytix[:3]:
            print(f'    img -> {u}', flush=True)
    except Exception as e:
        print(f'  err: {e}', flush=True)
