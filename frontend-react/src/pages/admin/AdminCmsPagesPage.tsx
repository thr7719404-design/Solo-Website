import { useState, useEffect } from 'react';
import { cmsApi, type HomePageConfig, type HomeSection, type CategoryLanding, type CategoryLandingSection } from '@/api/cms';
import styles from './Admin.module.css';

type Tab = 'home' | 'landings';

export default function AdminCmsPagesPage() {
  const [tab, setTab] = useState<Tab>('home');
  const [home, setHome] = useState<HomePageConfig | null>(null);
  const [landings, setLandings] = useState<CategoryLanding[]>([]);
  const [activeLanding, setActiveLanding] = useState<CategoryLanding | null>(null);

  // Section editor (used for both home + landing sections)
  const [sectionDrawer, setSectionDrawer] = useState(false);
  const [sectionScope, setSectionScope] = useState<'home' | 'landing'>('home');
  const [editingSection, setEditingSection] = useState<HomeSection | CategoryLandingSection | null>(null);
  const [sForm, setSForm] = useState<{ type: string; title: string; subtitle: string; isEnabled: boolean; configText: string; position: number }>({
    type: '', title: '', subtitle: '', isEnabled: true, configText: '{}', position: 0,
  });

  // Landing editor
  const [landingDrawer, setLandingDrawer] = useState(false);
  const [editingLanding, setEditingLanding] = useState<CategoryLanding | null>(null);
  const [lForm, setLForm] = useState<Partial<CategoryLanding>>({});

  const [saving, setSaving] = useState(false);

  const loadHome = () => cmsApi.getHome().then(setHome).catch(() => setHome(null));
  const loadLandings = () => cmsApi.listLandings().then(setLandings).catch(() => {});
  const loadLanding = (id: string) => cmsApi.getLanding(id).then(setActiveLanding).catch(() => {});

  useEffect(() => { loadHome(); loadLandings(); }, []);

  // ── Sections ──────────────────────────────────────────────
  const openNewSection = (scope: 'home' | 'landing') => {
    setSectionScope(scope);
    setEditingSection(null);
    const pos = scope === 'home' ? (home?.sections?.length ?? 0) : (activeLanding?.sections?.length ?? 0);
    setSForm({ type: '', title: '', subtitle: '', isEnabled: true, configText: '{}', position: pos });
    setSectionDrawer(true);
  };
  const openEditSection = (scope: 'home' | 'landing', s: HomeSection | CategoryLandingSection) => {
    setSectionScope(scope);
    setEditingSection(s);
    setSForm({
      type: s.type,
      title: s.title ?? '',
      subtitle: 'subtitle' in s ? ((s as HomeSection).subtitle ?? '') : '',
      isEnabled: s.isEnabled,
      configText: JSON.stringify(s.config ?? {}, null, 2),
      position: s.position,
    });
    setSectionDrawer(true);
  };
  const saveSection = async () => {
    let configObj: Record<string, unknown>;
    try { configObj = JSON.parse(sForm.configText || '{}'); }
    catch { alert('Config JSON is invalid'); return; }

    setSaving(true);
    try {
      if (sectionScope === 'home') {
        const payload = {
          type: sForm.type, title: sForm.title || null, subtitle: sForm.subtitle || null,
          isEnabled: sForm.isEnabled, config: configObj, position: Number(sForm.position) || 0,
        };
        if (editingSection) await cmsApi.updateHomeSection(editingSection.id, payload as Partial<HomeSection>);
        else await cmsApi.createHomeSection(payload as Partial<HomeSection> & { type: string; position: number });
        await loadHome();
      } else {
        if (!activeLanding) return;
        const payload = {
          type: sForm.type, title: sForm.title || null,
          isEnabled: sForm.isEnabled, config: configObj, position: Number(sForm.position) || 0,
        };
        if (editingSection) await cmsApi.updateLandingSection(editingSection.id, payload as Partial<CategoryLandingSection>);
        else await cmsApi.createLandingSection(activeLanding.id, payload as Partial<CategoryLandingSection> & { type: string; position: number });
        await loadLanding(activeLanding.id);
      }
      setSectionDrawer(false);
    } catch (e: unknown) {
      alert((e as { message?: string })?.message || 'Save failed');
    }
    setSaving(false);
  };
  const removeSection = async (scope: 'home' | 'landing', id: string) => {
    if (!confirm('Delete this section?')) return;
    if (scope === 'home') { await cmsApi.removeHomeSection(id).catch(() => {}); await loadHome(); }
    else { await cmsApi.removeLandingSection(id).catch(() => {}); if (activeLanding) await loadLanding(activeLanding.id); }
  };

  // ── Landings ──────────────────────────────────────────────
  const openNewLanding = () => {
    setEditingLanding(null);
    setLForm({ categoryId: '', heroTitle: '', heroSubtitle: '', heroImageUrl: '', heroImageMobileUrl: '', ctaLabel: '', ctaTargetType: '', ctaTargetValue: '', isHeroEnabled: true });
    setLandingDrawer(true);
  };
  const openEditLanding = (l: CategoryLanding) => {
    setEditingLanding(l);
    setLForm({
      categoryId: l.categoryId, heroTitle: l.heroTitle ?? '', heroSubtitle: l.heroSubtitle ?? '',
      heroImageUrl: l.heroImageUrl ?? '', heroImageMobileUrl: l.heroImageMobileUrl ?? '',
      ctaLabel: l.ctaLabel ?? '', ctaTargetType: l.ctaTargetType ?? '', ctaTargetValue: l.ctaTargetValue ?? '',
      isHeroEnabled: l.isHeroEnabled,
    });
    setLandingDrawer(true);
  };
  const saveLanding = async () => {
    if (!lForm.categoryId) { alert('Category ID is required'); return; }
    setSaving(true);
    try {
      if (editingLanding) await cmsApi.updateLanding(editingLanding.id, lForm);
      else await cmsApi.createLanding({ ...lForm, categoryId: lForm.categoryId });
      setLandingDrawer(false);
      await loadLandings();
    } catch (e: unknown) {
      alert((e as { message?: string })?.message || 'Save failed');
    }
    setSaving(false);
  };
  const removeLanding = async (id: string) => {
    if (!confirm('Delete this landing page?')) return;
    await cmsApi.removeLanding(id).catch(() => {});
    if (activeLanding?.id === id) setActiveLanding(null);
    loadLandings();
  };

  const fl = (k: keyof CategoryLanding, v: unknown) => setLForm((p) => ({ ...p, [k]: v }));
  const fs = <K extends keyof typeof sForm>(k: K, v: typeof sForm[K]) => setSForm((p) => ({ ...p, [k]: v }));

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Pages</h1>
          <span className={styles['header-v2-sub']}>Build the homepage and category landing pages</span>
        </div>
        {tab === 'landings' && <button className={styles['btn-primary']} onClick={openNewLanding}>+ New Landing</button>}
      </div>

      <div className={styles['admin-body']}>
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--admin-glass-border)', width: 'fit-content' }}>
          {(['home', 'landings'] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              style={{
                padding: '10px 24px', fontWeight: 600, fontSize: 13, cursor: 'pointer', border: 'none',
                background: tab === t ? 'var(--admin-accent)' : 'var(--admin-glass)',
                color: tab === t ? '#fff' : 'var(--admin-text-dim)', textTransform: 'capitalize',
              }}>
              {t === 'home' ? 'Homepage' : 'Category Landings'}
            </button>
          ))}
        </div>

        {tab === 'home' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, color: 'var(--admin-text-dim)' }}>Sections render top-to-bottom on the storefront homepage.</div>
              <button className={styles['btn-primary']} onClick={() => openNewSection('home')}>+ New Section</button>
            </div>
            <div className={styles['table-v2-wrap']}>
              <table className={styles['table-v2']}>
                <thead><tr><th>Pos</th><th>Type</th><th>Title</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {(home?.sections ?? []).length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No sections yet</td></tr>
                  ) : (home?.sections ?? []).sort((a, b) => a.position - b.position).map((s) => (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{s.position}</td>
                      <td><span className={`${styles['table-tag']} ${styles['table-tag-cyan']}`}>{s.type}</span></td>
                      <td className={styles['table-name']}>{s.title || '—'}</td>
                      <td>
                        <span className={`${styles['table-tag']} ${styles[s.isEnabled ? 'table-tag-green' : 'table-tag-gray']}`}>
                          {s.isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <div className={styles['table-actions']}>
                          <button className={styles['table-action-btn']} onClick={() => openEditSection('home', s)}>✏️</button>
                          <button className={styles['table-action-btn']} onClick={() => removeSection('home', s.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'landings' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
            {/* Landings list */}
            <div style={{ background: 'var(--admin-glass)', border: '1px solid var(--admin-glass-border)', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--admin-text-muted)', padding: '4px 8px 8px' }}>Landings</div>
              {landings.length === 0 ? (
                <div style={{ padding: 16, color: 'var(--admin-text-muted)', fontSize: 13 }}>No landings yet</div>
              ) : landings.map((l) => (
                <div key={l.id}
                  style={{
                    padding: '10px 12px', borderRadius: 8, marginBottom: 4, cursor: 'pointer',
                    background: activeLanding?.id === l.id ? 'var(--admin-accent)' : 'transparent',
                    color: activeLanding?.id === l.id ? '#fff' : 'var(--admin-text-dim)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                  onClick={() => loadLanding(l.id)}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{l.heroTitle || '(untitled)'}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>{l.categoryId}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <button className={styles['table-action-btn']} onClick={() => openEditLanding(l)}>✏️</button>
                    <button className={styles['table-action-btn']} onClick={() => removeLanding(l.id)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Active landing sections */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, color: 'var(--admin-text-dim)' }}>
                  {activeLanding ? <>Sections for landing of <b style={{ color: '#fff' }}>{activeLanding.categoryId}</b></> : 'Select a landing'}
                </div>
                {activeLanding && <button className={styles['btn-primary']} onClick={() => openNewSection('landing')}>+ New Section</button>}
              </div>
              {activeLanding && (
                <div className={styles['table-v2-wrap']}>
                  <table className={styles['table-v2']}>
                    <thead><tr><th>Pos</th><th>Type</th><th>Title</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {activeLanding.sections.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No sections yet</td></tr>
                      ) : [...activeLanding.sections].sort((a, b) => a.position - b.position).map((s) => (
                        <tr key={s.id}>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{s.position}</td>
                          <td><span className={`${styles['table-tag']} ${styles['table-tag-cyan']}`}>{s.type}</span></td>
                          <td className={styles['table-name']}>{s.title || '—'}</td>
                          <td>
                            <span className={`${styles['table-tag']} ${styles[s.isEnabled ? 'table-tag-green' : 'table-tag-gray']}`}>
                              {s.isEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td>
                            <div className={styles['table-actions']}>
                              <button className={styles['table-action-btn']} onClick={() => openEditSection('landing', s)}>✏️</button>
                              <button className={styles['table-action-btn']} onClick={() => removeSection('landing', s.id)}>🗑</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section drawer */}
      {sectionDrawer && (
        <>
          <button type="button" aria-label="Close" className={styles['drawer-backdrop']} onClick={() => setSectionDrawer(false)} />
          <div className={styles['drawer']}>
            <div className={styles['drawer-header']}>
              <h2>{editingSection ? 'Edit Section' : 'New Section'} <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>({sectionScope})</span></h2>
              <button className={styles['drawer-close']} onClick={() => setSectionDrawer(false)}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              <div className={styles['field']}>
                <label htmlFor="sec-type">Type * <span style={{ color: 'var(--admin-text-muted)', fontWeight: 400 }}>(see schema HomeSectionType / CategoryLandingSectionType)</span></label>
                <input id="sec-type" value={sForm.type} onChange={(e) => fs('type', e.target.value)} placeholder="HERO_BANNER, FEATURED_PRODUCTS, …" />
              </div>
              <div className={styles['field']}>
                <label htmlFor="sec-title">Title</label>
                <input id="sec-title" value={sForm.title} onChange={(e) => fs('title', e.target.value)} />
              </div>
              {sectionScope === 'home' && (
                <div className={styles['field']}>
                  <label htmlFor="sec-subtitle">Subtitle</label>
                  <input id="sec-subtitle" value={sForm.subtitle} onChange={(e) => fs('subtitle', e.target.value)} />
                </div>
              )}
              <div className={styles['field']}>
                <label htmlFor="sec-pos">Position</label>
                <input id="sec-pos" type="number" value={sForm.position} onChange={(e) => fs('position', Number(e.target.value) || 0)} />
              </div>
              <div className={styles['field']}>
                <label htmlFor="sec-config">Config JSON</label>
                <textarea id="sec-config" rows={10} value={sForm.configText} onChange={(e) => fs('configText', e.target.value)}
                  style={{ fontFamily: 'inherit', fontSize: 12 }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 8 }}>
                <input type="checkbox" checked={sForm.isEnabled} onChange={(e) => fs('isEnabled', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--admin-accent)' }} />
                Enabled
              </label>
            </div>
            <div className={styles['drawer-footer']}>
              <button className={styles['btn-secondary']} onClick={() => setSectionDrawer(false)}>Cancel</button>
              <button className={styles['btn-primary']} onClick={saveSection} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </>
      )}

      {/* Landing drawer */}
      {landingDrawer && (
        <>
          <button type="button" aria-label="Close" className={styles['drawer-backdrop']} onClick={() => setLandingDrawer(false)} />
          <div className={styles['drawer']}>
            <div className={styles['drawer-header']}>
              <h2>{editingLanding ? 'Edit Landing' : 'New Landing'}</h2>
              <button className={styles['drawer-close']} onClick={() => setLandingDrawer(false)}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              <div className={styles['field']}>
                <label htmlFor="l-cat">Category ID *</label>
                <input id="l-cat" value={lForm.categoryId ?? ''} onChange={(e) => fl('categoryId', e.target.value)} disabled={!!editingLanding} />
              </div>
              <div className={styles['field']}>
                <label htmlFor="l-title">Hero Title</label>
                <input id="l-title" value={lForm.heroTitle ?? ''} onChange={(e) => fl('heroTitle', e.target.value)} />
              </div>
              <div className={styles['field']}>
                <label htmlFor="l-subtitle">Hero Subtitle</label>
                <input id="l-subtitle" value={lForm.heroSubtitle ?? ''} onChange={(e) => fl('heroSubtitle', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className={styles['field']}>
                  <label htmlFor="l-img">Hero Image URL</label>
                  <input id="l-img" value={lForm.heroImageUrl ?? ''} onChange={(e) => fl('heroImageUrl', e.target.value)} />
                </div>
                <div className={styles['field']}>
                  <label htmlFor="l-img-mob">Hero Image (Mobile)</label>
                  <input id="l-img-mob" value={lForm.heroImageMobileUrl ?? ''} onChange={(e) => fl('heroImageMobileUrl', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className={styles['field']}>
                  <label htmlFor="l-cta">CTA Label</label>
                  <input id="l-cta" value={lForm.ctaLabel ?? ''} onChange={(e) => fl('ctaLabel', e.target.value)} />
                </div>
                <div className={styles['field']}>
                  <label htmlFor="l-cta-type">CTA Target Type</label>
                  <input id="l-cta-type" value={lForm.ctaTargetType ?? ''} onChange={(e) => fl('ctaTargetType', e.target.value)} placeholder="url, category, …" />
                </div>
                <div className={styles['field']}>
                  <label htmlFor="l-cta-val">CTA Target Value</label>
                  <input id="l-cta-val" value={lForm.ctaTargetValue ?? ''} onChange={(e) => fl('ctaTargetValue', e.target.value)} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 8 }}>
                <input type="checkbox" checked={lForm.isHeroEnabled ?? true} onChange={(e) => fl('isHeroEnabled', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--admin-accent)' }} />
                Hero Enabled
              </label>
            </div>
            <div className={styles['drawer-footer']}>
              <button className={styles['btn-secondary']} onClick={() => setLandingDrawer(false)}>Cancel</button>
              <button className={styles['btn-primary']} onClick={saveLanding} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
