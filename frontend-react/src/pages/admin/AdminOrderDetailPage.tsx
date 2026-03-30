import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '@/api/admin';
import type { OrderDto } from '@/types';
import styles from './Admin.module.css';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminApi.getOrder(id).then(r => { setOrder(r); setLoading(false); }).catch(() => { setLoading(false); });
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!id) return;
    setUpdating(true);
    try {
      await adminApi.updateOrderStatus(id, { status });
      setOrder(prev => prev ? { ...prev, status } : prev);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className={styles['admin-body']}><div className="loading-spinner" /></div>;
  if (!order) return <div className={styles['admin-body']}>Order not found.</div>;

  return (
    <>
      <div className={styles['admin-header']}>
        <h1>Order #{order.orderNumber ?? order.id.slice(0, 8)}</h1>
        <button className="btn btn-outline" onClick={() => navigate('/admin/orders')}>← Back</button>
      </div>
      <div className={styles['admin-body']}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div>
            <h3 style={{ marginBottom: 12 }}>Items</h3>
            <div className={styles['admin-table-wrap']}>
              <table className={styles['admin-table']}>
                <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                <tbody>
                  {order.items?.map((item, i) => (
                    <tr key={i}>
                      <td>{item.productName ?? (item as any).product?.name ?? '—'}</td>
                      <td>{item.quantity}</td>
                      <td>${Number(item.price).toFixed(2)}</td>
                      <td>${(Number(item.price) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <div className={styles['admin-form']} style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 12 }}>Summary</h3>
              <p><strong>Status:</strong> {order.status}</p>
              <p><strong>Total:</strong> ${Number(order.total).toFixed(2)}</p>
              <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div className={styles['admin-form']}>
              <h3 style={{ marginBottom: 12 }}>Update Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {STATUSES.map(s => (
                  <button
                    key={s}
                    className={`btn ${s === order.status ? 'btn-accent' : 'btn-outline'}`}
                    disabled={updating || s === order.status}
                    onClick={() => updateStatus(s)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
