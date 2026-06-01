import { useState, useEffect } from 'react';
import { navigationApi, type NavigationMenu, type NavigationMenuItem } from '@/api/navigation';
import styles from './Admin.module.css';

const emptyMenu = (): Partial<NavigationMenu> => ({ key: '', name: '', isActive: true });
const emptyItem = (): Partial<NavigationMenuItem> => ({
  label: '', url: '', icon: '', badge: '', badgeColor: '',
  openInNewTab: false, sortOrder: 0, isActive: true, parentId: null,
});

export default function AdminNavigationPage() {
  const [menus, setMenus] = useState<NavigationMenu[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<NavigationMenu | null>(null);

  const [menuDrawer, setMenuDrawer] = useState(false);
  const [editingMenu, setEditingMenu] = useState<NavigationMenu | null>(null);
  const [menuForm, setMenuForm] = useState(emptyMenu());

  const [itemDrawer, setItemDrawer] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationMenuItem | null>(null);
  const [itemForm, setItemForm] = useState(emptyItem());

  const [saving, setSaving] = useState(false);

  const loadMenus = () => navigationApi.getMenus().then((m) => {
    setMenus(m);
    if (!selectedId && m[0]) setSelectedId(m[0].id);
  }).catch(() => {});

  const loadSelected = (id: string) => navigationApi.getMenu(id).then(setSelected).catch(() => setSelected(null));

  useEffect(() => { loadMenus(); }, []);
  useEffect(() => { if (selectedId) loadSelected(selectedId); }, [selectedId]);

  const openNewMenu = () => { setEditingMenu(null); setMenuForm(emptyMenu()); setMenuDrawer(true); };
  const openEditMenu = (m: NavigationMenu) => {
    setEditingMenu(m);
    setMenuForm({ key: m.key, name: m.name, isActive: m.isActive });
    setMenuDrawer(true);
  };

  const saveMenu = async () => {
    setSaving(true);
    try {
      if (editingMenu) await navigationApi.updateMenu(editingMenu.id, menuForm);
      else await navigationApi.createMenu(menuForm);
      setMenuDrawer(false);
      await loadMenus();
    } catch (e: unknown) {
      alert((e as { message?: string })?.message || 'Save failed');
    }
    setSaving(false);
  };

  const removeMenu = async (id: string) => {
    if (!confirm('Delete this menu and all its items?')) return;
    await navigationApi.removeMenu(id).catch(() => {});
    if (selectedId === id) setSelectedId(null);
    loadMenus();
  };

  const openNewItem = () => {
    if (!selectedId) return;
    setEditingItem(null);
    setItemForm({ ...emptyItem(), menuId: selectedId, sortOrder: (selected?.items?.length ?? 0) });
    setItemDrawer(true);
  };
  const openEditItem = (it: NavigationMenuItem) => {
    setEditingItem(it);
    setItemForm({
      menuId: it.menuId, parentId: it.parentId ?? null, label: it.label,
      url: it.url ?? '', icon: it.icon ?? '', badge: it.badge ?? '',
      badgeColor: it.badgeColor ?? '', openInNewTab: it.openInNewTab,
      sortOrder: it.sortOrder, isActive: it.isActive,
    });
    setItemDrawer(true);
  };

  const saveItem = async () => {
    setSaving(true);
    try {
      const payload: Partial<NavigationMenuItem> = {
        ...itemForm,
        sortOrder: Number(itemForm.sortOrder) || 0,
        url: itemForm.url || null,
        parentId: itemForm.parentId || null,
      };
      if (editingItem) await navigationApi.updateItem(editingItem.id, payload);
      else await navigationApi.createItem(payload);
      setItemDrawer(false);
      if (selectedId) loadSelected(selectedId);
    } catch (e: unknown) {
      alert((e as { message?: string })?.message || 'Save failed');
    }
    setSaving(false);
  };

  const removeItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await navigationApi.removeItem(id).catch(() => {});
    if (selectedId) loadSelected(selectedId);
  };

  const fm = (k: keyof NavigationMenu, v: unknown) => setMenuForm((p) => ({ ...p, [k]: v }));
  const fi = (k: keyof NavigationMenuItem, v: unknown) => setItemForm((p) => ({ ...p, [k]: v }));

  const items = selected?.items ?? [];
  const topLevel = items.filter((i) => !i.parentId).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Navigation</h1>
          <span className={styles['header-v2-sub']}>Manage menus and links shown across the site</span>
        </div>
        <button className={styles['btn-primary']} onClick={openNewMenu}>+ New Menu</button>
      </div>

      <div className={styles['admin-body']} style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        {/* Menus list */}
        <div style={{ background: 'var(--admin-glass)', border: '1px solid var(--admin-glass-border)', borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--admin-text-muted)', padding: '4px 8px 8px' }}>Menus</div>
          {menus.length === 0 ? (
            <div style={{ padding: 16, color: 'var(--admin-text-muted)', fontSize: 13 }}>No menus yet</div>
          ) : menus.map((m) => (
            <div
              key={m.id}
              style={{
                padding: '10px 12px', borderRadius: 8, marginBottom: 4, cursor: 'pointer',
                background: selectedId === m.id ? 'var(--admin-accent)' : 'transparent',
                color: selectedId === m.id ? '#fff' : 'var(--admin-text-dim)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
              onClick={() => setSelectedId(m.id)}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{m.key}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                <button className={styles['table-action-btn']} onClick={() => openEditMenu(m)}>✏️</button>
                <button className={styles['table-action-btn']} onClick={() => removeMenu(m.id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>

        {/* Items table */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, color: 'var(--admin-text-dim)' }}>
              {selected ? <>Items in <b style={{ color: '#fff' }}>{selected.name}</b></> : 'Select a menu'}
            </div>
            {selected && <button className={styles['btn-primary']} onClick={openNewItem}>+ New Item</button>}
          </div>
          {selected && (
            <div className={styles['table-v2-wrap']}>
              <table className={styles['table-v2']}>
                <thead>
                  <tr><th>Order</th><th>Label</th><th>URL</th><th>Children</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {topLevel.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No items yet</td></tr>
                  ) : topLevel.map((it) => {
                    const childCount = items.filter((c) => c.parentId === it.id).length;
                    return (
                      <tr key={it.id}>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{it.sortOrder}</td>
                        <td className={styles['table-name']}>{it.label}</td>
                        <td style={{ fontSize: 12, color: 'var(--admin-text-dim)' }}>{it.url ?? '—'}</td>
                        <td style={{ textAlign: 'center' }}>{childCount > 0 ? childCount : '—'}</td>
                        <td>
                          <span className={`${styles['table-tag']} ${styles[it.isActive ? 'table-tag-green' : 'table-tag-gray']}`}>
                            {it.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </td>
                        <td>
                          <div className={styles['table-actions']}>
                            <button className={styles['table-action-btn']} onClick={() => openEditItem(it)}>✏️</button>
                            <button className={styles['table-action-btn']} onClick={() => removeItem(it.id)}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Menu drawer */}
      {menuDrawer && (
        <>
          <button type="button" aria-label="Close" className={styles['drawer-backdrop']} onClick={() => setMenuDrawer(false)} />
          <div className={styles['drawer']}>
            <div className={styles['drawer-header']}>
              <h2>{editingMenu ? 'Edit Menu' : 'New Menu'}</h2>
              <button className={styles['drawer-close']} onClick={() => setMenuDrawer(false)}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              <div className={styles['field']}>
                <label htmlFor="menu-key">Key * <span style={{ color: 'var(--admin-text-muted)', fontWeight: 400 }}>(unique, e.g. main, footer)</span></label>
                <input id="menu-key" value={menuForm.key ?? ''} onChange={(e) => fm('key', e.target.value)} disabled={!!editingMenu} />
              </div>
              <div className={styles['field']}>
                <label htmlFor="menu-name">Name *</label>
                <input id="menu-name" value={menuForm.name ?? ''} onChange={(e) => fm('name', e.target.value)} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 8 }}>
                <input type="checkbox" checked={menuForm.isActive ?? true} onChange={(e) => fm('isActive', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--admin-accent)' }} />
                Active
              </label>
            </div>
            <div className={styles['drawer-footer']}>
              <button className={styles['btn-secondary']} onClick={() => setMenuDrawer(false)}>Cancel</button>
              <button className={styles['btn-primary']} onClick={saveMenu} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </>
      )}

      {/* Item drawer */}
      {itemDrawer && (
        <>
          <button type="button" aria-label="Close" className={styles['drawer-backdrop']} onClick={() => setItemDrawer(false)} />
          <div className={styles['drawer']}>
            <div className={styles['drawer-header']}>
              <h2>{editingItem ? 'Edit Item' : 'New Item'}</h2>
              <button className={styles['drawer-close']} onClick={() => setItemDrawer(false)}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              <div className={styles['field']}>
                <label htmlFor="item-label">Label *</label>
                <input id="item-label" value={itemForm.label ?? ''} onChange={(e) => fi('label', e.target.value)} />
              </div>
              <div className={styles['field']}>
                <label htmlFor="item-url">URL</label>
                <input id="item-url" value={itemForm.url ?? ''} onChange={(e) => fi('url', e.target.value)} placeholder="/category/something" />
              </div>
              <div className={styles['field']}>
                <label htmlFor="item-parent">Parent (for sub-items)</label>
                <select id="item-parent" value={itemForm.parentId ?? ''} onChange={(e) => fi('parentId', e.target.value || null)}>
                  <option value="">— Top level —</option>
                  {topLevel.filter((p) => !editingItem || p.id !== editingItem.id).map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className={styles['field']}>
                  <label htmlFor="item-icon">Icon</label>
                  <input id="item-icon" value={itemForm.icon ?? ''} onChange={(e) => fi('icon', e.target.value)} />
                </div>
                <div className={styles['field']}>
                  <label htmlFor="item-badge">Badge</label>
                  <input id="item-badge" value={itemForm.badge ?? ''} onChange={(e) => fi('badge', e.target.value)} placeholder="NEW" />
                </div>
                <div className={styles['field']}>
                  <label htmlFor="item-badge-color">Badge Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {[
                      { name: 'Red',    value: '#ef4444' },
                      { name: 'Orange', value: '#f97316' },
                      { name: 'Amber',  value: '#f59e0b' },
                      { name: 'Green',  value: '#22c55e' },
                      { name: 'Teal',   value: '#14b8a6' },
                      { name: 'Blue',   value: '#3b82f6' },
                      { name: 'Indigo', value: '#6366f1' },
                      { name: 'Purple', value: '#8b5cf6' },
                      { name: 'Pink',   value: '#ec4899' },
                      { name: 'Gray',   value: '#6b7280' },
                      { name: 'Black',  value: '#111827' },
                    ].map((c) => {
                      const selected = (itemForm.badgeColor ?? '').toLowerCase() === c.value.toLowerCase();
                      return (
                        <button
                          key={c.value}
                          type="button"
                          title={`${c.name} (${c.value})`}
                          aria-label={`Set badge color to ${c.name}`}
                          onClick={() => fi('badgeColor', c.value)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: c.value,
                            border: selected ? '2px solid var(--admin-accent, #111)' : '1px solid rgba(0,0,0,0.2)',
                            boxShadow: selected ? '0 0 0 2px #fff inset' : 'none',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        />
                      );
                    })}
                    <input
                      type="color"
                      aria-label="Custom badge color"
                      title="Pick a custom color"
                      value={/^#[0-9a-fA-F]{6}$/.test(itemForm.badgeColor ?? '') ? (itemForm.badgeColor as string) : '#ef4444'}
                      onChange={(e) => fi('badgeColor', e.target.value)}
                      style={{ width: 28, height: 28, padding: 0, border: '1px solid rgba(0,0,0,0.2)', borderRadius: 4, background: 'transparent', cursor: 'pointer' }}
                    />
                    {itemForm.badgeColor && (
                      <button
                        type="button"
                        onClick={() => fi('badgeColor', '')}
                        title="Clear badge color"
                        aria-label="Clear badge color"
                        style={{ fontSize: 12, padding: '2px 8px', border: '1px solid rgba(0,0,0,0.2)', borderRadius: 4, background: '#fff', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles['field']}>
                <label htmlFor="item-sort">Sort Order</label>
                <input id="item-sort" type="number" value={itemForm.sortOrder ?? 0} onChange={(e) => fi('sortOrder', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={itemForm.isActive ?? true} onChange={(e) => fi('isActive', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--admin-accent)' }} />
                  Active
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={itemForm.openInNewTab ?? false} onChange={(e) => fi('openInNewTab', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--admin-accent)' }} />
                  Open in new tab
                </label>
              </div>
            </div>
            <div className={styles['drawer-footer']}>
              <button className={styles['btn-secondary']} onClick={() => setItemDrawer(false)}>Cancel</button>
              <button className={styles['btn-primary']} onClick={saveItem} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
