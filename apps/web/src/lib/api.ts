const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export type User = { id: string; name: string; email: string; role: 'CUSTOMER' | 'ADMIN' };
export type Product = { id: string; slug: string; title: string; description: string; pricePaise: number; coverUrl?: string | null };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
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
  verifyPayment: (payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => request<{ ok: true }>('/payments/verify', { method: 'POST', body: JSON.stringify(payload) }),
};
