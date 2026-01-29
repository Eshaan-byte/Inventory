const API_BASE_URL = 'http://localhost:3000/api';

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// API endpoints organized by module
export const api = {
  auth: {
    setupStatus: () => apiClient.get('/auth/setup-status'),
    setup: (data) => apiClient.post('/auth/setup', data),
    login: (data) => apiClient.post('/auth/login', data),
    me: () => apiClient.get('/auth/me'),
    users: () => apiClient.get('/auth/users'),
    createUser: (data) => apiClient.post('/auth/users', data),
  },

  medicines: {
    list: (params) => apiClient.get(`/medicines?${new URLSearchParams(params)}`),
    get: (id) => apiClient.get(`/medicines/${id}`),
    search: (query) => apiClient.get(`/medicines/search/autocomplete?q=${query}`),
    checkDuplicate: (data) => apiClient.post('/medicines/check-duplicate', data),
    create: (data) => apiClient.post('/medicines', data),
    update: (id, data) => apiClient.put(`/medicines/${id}`, data),
    delete: (id) => apiClient.delete(`/medicines/${id}`),
  },

  batches: {
    byMedicine: (medicineId) => apiClient.get(`/batches/medicine/${medicineId}`),
    available: (medicineId) => apiClient.get(`/batches/medicine/${medicineId}/available`),
    get: (id) => apiClient.get(`/batches/${id}`),
    create: (data) => apiClient.post('/batches', data),
    updateStock: (id, data) => apiClient.patch(`/batches/${id}/stock`, data),
    update: (id, data) => apiClient.put(`/batches/${id}`, data),
    expiryAlerts: (days) => apiClient.get(`/batches/alerts/expiry?days=${days}`),
    expired: () => apiClient.get('/batches/alerts/expired'),
  },

  sales: {
    list: (params) => apiClient.get(`/sales?${new URLSearchParams(params)}`),
    get: (id) => apiClient.get(`/sales/${id}`),
    generateInvoiceNo: () => apiClient.get('/sales/generate/invoice-number'),
    create: (data) => apiClient.post('/sales', data),
    dailySummary: (date) => apiClient.get(`/sales/reports/daily?date=${date}`),
  },

  purchases: {
    list: (params) => apiClient.get(`/purchases?${new URLSearchParams(params)}`),
    get: (id) => apiClient.get(`/purchases/${id}`),
    create: (data) => apiClient.post('/purchases', data),
  },

  customers: {
    list: (search) => apiClient.get(`/customers${search ? `?search=${search}` : ''}`),
    get: (id) => apiClient.get(`/customers/${id}`),
    search: (query) => apiClient.get(`/customers/search/autocomplete?q=${query}`),
    create: (data) => apiClient.post('/customers', data),
    update: (id, data) => apiClient.put(`/customers/${id}`, data),
  },

  suppliers: {
    list: (search) => apiClient.get(`/suppliers${search ? `?search=${search}` : ''}`),
    get: (id) => apiClient.get(`/suppliers/${id}`),
    create: (data) => apiClient.post('/suppliers', data),
    update: (id, data) => apiClient.put(`/suppliers/${id}`, data),
  },

  reports: {
    stockSummary: (search) => apiClient.get(`/reports/stock-summary${search ? `?search=${search}` : ''}`),
    batchStock: (medicineId) => apiClient.get(`/reports/batch-stock${medicineId ? `?medicine_id=${medicineId}` : ''}`),
    expiry: (days) => apiClient.get(`/reports/expiry?days=${days}`),
    sales: (params) => apiClient.get(`/reports/sales?${new URLSearchParams(params)}`),
    purchases: (params) => apiClient.get(`/reports/purchases?${new URLSearchParams(params)}`),
    profitMargin: (params) => apiClient.get(`/reports/profit-margin?${new URLSearchParams(params)}`),
    gstr1: (params) => apiClient.get(`/reports/gstr1?${new URLSearchParams(params)}`),
    hsnSummary: (params) => apiClient.get(`/reports/hsn-summary?${new URLSearchParams(params)}`),
  },

  settings: {
    list: () => apiClient.get('/settings'),
    get: (key) => apiClient.get(`/settings/${key}`),
    save: (data) => apiClient.post('/settings', data),
    bulkUpdate: (data) => apiClient.put('/settings/bulk', data),
    getCompany: () => apiClient.get('/settings/company/profile'),
    saveCompany: (data) => apiClient.post('/settings/company/profile', data),
  },
};
