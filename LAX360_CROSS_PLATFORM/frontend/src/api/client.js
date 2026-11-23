import { storage } from '../utils/storage';

const API_BASE_URL =
  typeof window !== 'undefined' && (window.location.origin.includes(':8000') || window.location.port === '8000')
    ? '/api/v1'
    : 'http://127.0.0.1:8000/api/v1';

async function request(endpoint, options = {}) {
  const token = await storage.getItem('texbill_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(url, config);
    if (res.status === 401) {
      // Unauthorized
      await storage.removeItem('texbill_token');
      await storage.removeItem('texbill_user');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = data?.detail || `HTTP Error ${res.status}`;
      throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
    return data;
  } catch (err) {
    console.error(`[API Request Error] ${options.method || 'GET'} ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (identifier, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    }),
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getMe: () => request('/auth/me'),
  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
  resetPassword: (token, new_password) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password })
    }),

  // Products
  getProducts: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.category && params.category !== 'All') q.append('category', params.category);
    if (params.fabric && params.fabric !== 'All') q.append('fabric', params.fabric);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request(`/products${qs}`);
  },
  createProduct: (payload) =>
    request('/products', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateProduct: (id, payload) =>
    request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  deleteProduct: (id) =>
    request(`/products/${id}`, {
      method: 'DELETE'
    }),

  // Customers
  getCustomers: (search = '') => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/customers${qs}`);
  },
  createCustomer: (payload) =>
    request('/customers', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateCustomer: (id, payload) =>
    request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  deleteCustomer: (id) =>
    request(`/customers/${id}`, {
      method: 'DELETE'
    }),
  getCustomerHistory: (id) => request(`/customers/${id}/history`),

  // Invoices
  getInvoices: (period = 'all', search = '') => {
    const q = new URLSearchParams({ period });
    if (search) q.append('search', search);
    return request(`/invoices?${q.toString()}`);
  },
  getInvoiceById: (id) => request(`/invoices/${id}`),
  createInvoice: (payload) =>
    request('/invoices', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Coupons & Offers
  getCoupons: (activeOnly = false) => request(`/coupons?active_only=${activeOnly}`),
  createCoupon: (payload) =>
    request('/coupons', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateCoupon: (id, payload) =>
    request(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  deleteCoupon: (id) =>
    request(`/coupons/${id}`, {
      method: 'DELETE'
    }),
  validateCoupon: (code, cartTotal, customerId, categories = []) =>
    request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, cart_total: cartTotal, customer_id: customerId, categories })
    }),
  getFestivalOffers: () => request('/festival-offers'),
  getActiveFestival: () => request('/festival-offers/active-check'),
  createFestivalOffer: (payload) =>
    request('/festival-offers', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateFestivalOffer: (id, payload) =>
    request(`/festival-offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  deleteFestivalOffer: (id) =>
    request(`/festival-offers/${id}`, {
      method: 'DELETE'
    }),

  // Dashboard & Reports
  getDashboardMetrics: () => request('/dashboard/metrics'),
  getSalesReport: (period = 'this_month', startDate = null, endDate = null) => {
    const q = new URLSearchParams({ period });
    if (startDate) q.append('start_date', startDate);
    if (endDate) q.append('end_date', endDate);
    return request(`/reports/sales?${q.toString()}`);
  },

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (payload) =>
    request('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  resetDemoData: () =>
    request('/settings/reset-demo', {
      method: 'POST'
    })
};
