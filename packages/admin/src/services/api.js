import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('auth-storage');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// Theme API
export const themeApi = {
    getAll: () => api.get('/themes'),
    getOne: (slug) => api.get(`/themes/${slug}`),
    activate: (slug) => api.post(`/themes/${slug}/activate`),
    importDemo: (slug) => api.post(`/themes/${slug}/import-demo`),
    updateSettings: (slug, settings) => api.put(`/themes/${slug}/settings`, { settings }),
    refresh: () => api.post('/themes/refresh'),
};

// Page API
export const pageApi = {
    getAll: (params) => api.get('/pages', { params }),
    getOne: (id) => api.get(`/pages/${id}`),
    create: (data) => api.post('/pages', data),
    update: (id, data) => api.put(`/pages/${id}`, data),
    delete: (id) => api.delete(`/pages/${id}`),
    publish: (id) => api.post(`/pages/${id}/publish`),
    unpublish: (id) => api.post(`/pages/${id}/unpublish`),
};

// Crawler API
export const crawlerApi = {
    crawl: (url, options) => api.post('/crawler/crawl', { url, options }),
    getJobs: (params) => api.get('/crawler/jobs', { params }),
    getJob: (id) => api.get(`/crawler/jobs/${id}`),
    importAsPage: (id, data) => api.post(`/crawler/${id}/import`, data),
    deleteJob: (id) => api.delete(`/crawler/jobs/${id}`),
};

// Media API
export const mediaApi = {
    getAll: (params) => api.get('/media', { params }),
    upload: (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/media/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: onProgress,
        });
    },
    uploadMultiple: (files) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        return api.post('/media/upload-multiple', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    update: (id, data) => api.put(`/media/${id}`, data),
    delete: (id) => api.delete(`/media/${id}`),
};

// Settings API
export const settingsApi = {
    getAll: () => api.get('/settings'),
    get: (key) => api.get(`/settings/${key}`),
    update: (key, value) => api.put(`/settings/${key}`, { value }),
    updateMultiple: (settings) => api.put('/settings', settings),
};

// Posts API
export const postApi = {
    getAll: (params) => api.get('/posts', { params }),
    getOne: (id) => api.get(`/posts/${id}`),
    create: (data) => api.post('/posts', data),
    update: (id, data) => api.put(`/posts/${id}`, data),
    delete: (id) => api.delete(`/posts/${id}`),
    publish: (id) => api.post(`/posts/${id}/publish`),
    unpublish: (id) => api.post(`/posts/${id}/unpublish`),
    // Categories
    getCategories: () => api.get('/posts/categories'),
    createCategory: (data) => api.post('/posts/categories', data),
    updateCategory: (id, data) => api.put(`/posts/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/posts/categories/${id}`),
};

// Products API
export const productApi = {
    getAll: (params) => api.get('/products', { params }),
    getOne: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    // Categories
    getCategories: () => api.get('/products/categories'),
    createCategory: (data) => api.post('/products/categories', data),
    updateCategory: (id, data) => api.put(`/products/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/products/categories/${id}`),
};
