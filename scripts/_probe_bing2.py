"""Test search engines with real product name."""
import requests
import re

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept': 'text/html,*/*',
    'Accept-Language': 'en-US,en;q=0.5',
}

# (sku, name, brand)
tests = [
    ('260148', 'Multi Pot 4.8 l 24 cm Mosaic', 'Eva Trio'),
    ('541001', 'Syrah', 'Eva Solo'),
    ('505041', '24/12 To Go Flask Black', 'Eva Solo'),
    ('571422', 'Glow Lantern 27 cm Black', 'Eva Solo'),
]

for sku, name, brand in tests:
    print(f'\n=== {sku} | {brand} {name} ===', flush=True)
    queries = [
        f'evasolo.com {brand} {name}',
        f'site:evasolo.com {brand} {name}',
        f'{brand} {name} {sku}',
    ]
    for q in queries:
        try:
            r = requests.get('https://www.bing.com/search', params={'q': q}, headers=HEADERS, timeout=15)
            urls = list(dict.fromkeys(re.findall(r'https?://(?:www\.)?evasolo\.com/[^"\'<>\s)]+', r.text)))
            plytix = list(dict.fromkeys(re.findall(r'https?://[^"\'<>\s)]*plytix[^"\'<>\s)]+\.(?:jpg|jpeg|png|webp)', r.text)))
            print(f'  q="{q[:70]}" status={r.status_code} evasolo={len(urls)} plytix={len(plytix)}', flush=True)
            for u in urls[:3]:
                print(f'    web -> {u[:100]}', flush=True)
            for u in plytix[:3]:
                print(f'    img -> {u[:100]}', flush=True)
            if urls or plytix:
                break
        except Exception as e:
            print(f'  err: {e}', flush=True)
