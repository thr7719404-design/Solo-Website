import sys, os
os.environ['PGPASSWORD'] = 'x'
os.environ['AZURE_STORAGE_CONNECTION_STRING'] = 'x'
sys.path.insert(0, 'scripts')
import importlib.util
spec = importlib.util.spec_from_file_location('p3', 'scripts/load_images_phase3_search.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
import requests
s = requests.Session()
for sku in ['260122', '568015', '551797', '260118', '202090', '503042']:
    url = m.find_product_page_for_sku(sku, s)
    print(f'{sku}: {url}', flush=True)
    if url:
        paths = m.scrape_product_page(url, sku, s)
        print(f'  -> {len(paths)} image paths', flush=True)
        for p in paths[:2]:
            print(f'    {p}', flush=True)
