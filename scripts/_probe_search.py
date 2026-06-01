import requests
s = requests.Session()
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,*/*',
}
for url in [
    'https://www.evasolo.com/en/search?q=568015',
    'https://www.evasolo.com/Default.aspx?ID=4244&q=568015',
    'https://www.evasolo.com/?q=568015',
    'https://www.evasolo.com/en/Default.aspx?ID=4244&q=568015',
]:
    r = s.get(url, headers=HEADERS, timeout=20, allow_redirects=True)
    print(f'{url}\n  -> {r.status_code}  final={r.url}\n  len={len(r.text)}\n  has568015={"568015" in r.text}\n  hasplytix={"Plytix" in r.text}')
    print()
