import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminCategoriesPage from './AdminCategoriesPage';
import AdminSubcategoriesPage from './AdminSubcategoriesPage';

type TabKey = 'categories' | 'subcategories';

export default function AdminCategoryManagementPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initial: TabKey = params.get('tab') === 'subcategories' ? 'subcategories' : 'categories';
  const [tab, setTab] = useState<TabKey>(initial);

  useEffect(() => {
    const next: TabKey = params.get('tab') === 'subcategories' ? 'subcategories' : 'categories';
    setTab(next);
  }, [params]);

  const switchTab = (next: TabKey) => {
    setTab(next);
    navigate(`/admin/categories?tab=${next}`, { replace: true });
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 600,
    border: 0,
    background: 'transparent',
    color: active ? '#2563eb' : '#6b7280',
    borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
    cursor: 'pointer',
    marginBottom: -1,
  });

  return (
    <div>
      <div style={{
        display: 'flex',
        gap: 4,
        borderBottom: '1px solid #e5e7eb',
        padding: '0 4px',
        marginBottom: 16,
      }}>
        <button type="button" style={tabBtn(tab === 'categories')} onClick={() => switchTab('categories')}>
          Categories
        </button>
        <button type="button" style={tabBtn(tab === 'subcategories')} onClick={() => switchTab('subcategories')}>
          Subcategories
        </button>
      </div>

      {tab === 'categories' ? <AdminCategoriesPage /> : <AdminSubcategoriesPage />}
    </div>
  );
}
