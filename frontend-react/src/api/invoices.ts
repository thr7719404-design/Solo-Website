import api from './client';

/**
 * Download an order's invoice PDF and trigger a save dialog.
 * The endpoint is shared between admin and customers (server enforces ownership).
 */
export async function downloadOrderInvoice(orderId: string, orderNumber?: string): Promise<void> {
  const res = await api.get<Blob>(`/orders/${orderId}/invoice/download`, {
    responseType: 'blob',
  });
  const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${orderNumber || orderId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
