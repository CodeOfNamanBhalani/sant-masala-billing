/**
 * Sant Masala - API Client
 * Handles all API requests
 */

const API_BASE = '/api';

/**
 * Make API request
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options
    };
    
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * API Methods
 */
const api = {
    // Dashboard
    getDashboardStats: () => apiRequest('/dashboard/stats'),
    
    // Categories
    getCategories: () => apiRequest('/categories'),
    getCategory: (id) => apiRequest(`/categories/${id}`),
    createCategory: (data) => apiRequest('/categories', { method: 'POST', body: data }),
    updateCategory: (id, data) => apiRequest(`/categories/${id}`, { method: 'PUT', body: data }),
    deleteCategory: (id) => apiRequest(`/categories/${id}`, { method: 'DELETE' }),
    
    // Products
    getProducts: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/products${query ? '?' + query : ''}`);
    },
    getProduct: (id) => apiRequest(`/products/${id}`),
    createProduct: (data) => apiRequest('/products', { method: 'POST', body: data }),
    updateProduct: (id, data) => apiRequest(`/products/${id}`, { method: 'PUT', body: data }),
    deleteProduct: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),
    
    // Customers
    getCustomers: (search = '') => apiRequest(`/customers${search ? '?search=' + search : ''}`),
    getCustomer: (id) => apiRequest(`/customers/${id}`),
    createCustomer: (data) => apiRequest('/customers', { method: 'POST', body: data }),
    updateCustomer: (id, data) => apiRequest(`/customers/${id}`, { method: 'PUT', body: data }),
    deleteCustomer: (id) => apiRequest(`/customers/${id}`, { method: 'DELETE' }),
    
    // Orders
    getOrders: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/orders${query ? '?' + query : ''}`);
    },
    getOrder: (id) => apiRequest(`/orders/${id}`),
    createOrder: (data) => apiRequest('/orders', { method: 'POST', body: data }),
    updateOrder: (id, data) => apiRequest(`/orders/${id}`, { method: 'PUT', body: data }),
    deleteOrder: (id) => apiRequest(`/orders/${id}`, { method: 'DELETE' }),
    
    // Settings
    getSettings: () => apiRequest('/settings'),
    saveSettings: (data) => apiRequest('/settings', { method: 'POST', body: data }),
    
    // Print
    getReceiptData: (orderId) => apiRequest(`/print/receipt/${orderId}`)
};
