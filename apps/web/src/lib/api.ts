const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export type User = { id: string; name: string; email: string; role: 'CUSTOMER' | 'ADMIN' };
export type Product = { id: string; slug: string; title: string; description: string; pricePaise: number; coverUrl?: string | null; fileKey?: string | null; published?: boolean };
export type AdminOverview = { products: number; customers: number; paidOrders: number; revenuePaise: number };
export type AdminOrder = { id: string; amountPaise: number; currency: string; status: string; createdAt: string; paidAt?: string | null; user: { id: string; name: string; email: string }; items: Array<{ product: { id: string; title: string; slug: string }; pricePaise: number }> };
export type AdminCustomer = { id: string; name: string; email: string; createdAt: string; orders: number; resourcesOwned: number };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message ?? 'Something went wrong.');
  return data as T;
}

export const api = {
  me: () => request<{ user: User }>('/auth/me'),
  login: (email: string, password: string) => request<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) => request<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
  products: () => request<Product[]>('/products'),
  purchases: () => request<Array<{ id: string; product: Product; grantedAt: string }>>('/me/purchases'),
  createOrder: (productId: string) => request<{ orderId: string; razorpayOrderId: string; keyId: string; amountPaise: number; currency: string; product: { id: string; title: string } }>('/payments/create-order', { method: 'POST', body: JSON.stringify({ productId }) }),
  verifyPayment: (payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => request<{ ok: true }>('/payments/verify', { method: 'POST', body: JSON.stringify({ razorpayOrderId: payload.razorpay_order_id, razorpayPaymentId: payload.razorpay_payment_id, razorpaySignature: payload.razorpay_signature }) }),
  downloadResource: async (productId: string) => {
    const response = await fetch(`${API_URL}/products/${productId}/download`, { credentials: 'include' });
    if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.message ?? 'Download failed.'); }
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'skillora-resource.pdf'; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  },
  adminOverview: () => request<AdminOverview>('/admin/overview'),
  adminOrders: () => request<AdminOrder[]>('/admin/orders'),
  adminCustomers: () => request<AdminCustomer[]>('/admin/customers'),
  adminProducts: () => request<Product[]>('/admin/products'),
  adminCreateProduct: (payload: { title: string; slug: string; description: string; pricePaise: number; coverUrl?: string; published: boolean }) => request<Product>('/admin/products', { method: 'POST', body: JSON.stringify(payload) }),
  adminUpdateProduct: (id: string, payload: Partial<{ title: string; slug: string; description: string; pricePaise: number; coverUrl: string | null; published: boolean }>) => request<Product>(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  adminDeleteProduct: (id: string) => request<void>(`/admin/products/${id}`, { method: 'DELETE' }),
  adminUploadPdf: async (productId: string, file: File) => {
    const form = new FormData(); form.append('file', file, file.name);
    const response = await fetch(`${API_URL}/admin/products/${productId}/file`, { method: 'POST', credentials: 'include', body: form });
    const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message ?? 'Upload failed.'); return data as { fileKey: string; message: string };
  },
  adminDeletePdf: (productId: string) => request<void>(`/admin/products/${productId}/file`, { method: 'DELETE' }),
  adminPreviewResource: async (productId: string) => {
    const response = await fetch(`${API_URL}/admin/products/${productId}/preview`, { credentials: 'include' });
    if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.message ?? 'Preview failed.'); }
    const blob = await response.blob(); return URL.createObjectURL(blob);
  },
};
