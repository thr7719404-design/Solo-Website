import { useEffect, useState } from 'react';
import { navigationApi, type NavigationMenuItem } from '@/api/navigation';

const cache = new Map<string, NavigationMenuItem[]>();

/**
 * Fetches an active navigation menu by its key (e.g. "main-nav", "footer-nav", "top-links").
 * Returns top-level items (children are populated). Empty array while loading or on error.
 * Result is cached in-memory for the session.
 */
export function useNavMenu(key: string): NavigationMenuItem[] {
  const [items, setItems] = useState<NavigationMenuItem[]>(() => cache.get(key) ?? []);

  useEffect(() => {
    if (cache.has(key)) {
      setItems(cache.get(key)!);
      return;
    }
    let cancelled = false;
    navigationApi
      .getMenuByKey(key)
      .then((menu) => {
        const list = (menu.items ?? []).filter((i) => i.isActive);
        cache.set(key, list);
        if (!cancelled) setItems(list);
      })
      .catch(() => {
        cache.set(key, []);
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return items;
}
