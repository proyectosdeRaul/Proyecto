import axios from 'axios';

console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL
});

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mida-backend-gpb7.onrender.com';
console.log('API_BASE_URL final:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth functions
export const loginUser = async (username: string, password: string) => {
  console.log('loginUser called with:', { username, baseURL: API_BASE_URL });
  try {
    const response = await api.post('/api/auth/login', { username, password });
    console.log('loginUser response:', response.data);
    return response.data;
  } catch (error) {
    console.error('loginUser error:', error);
    throw error;
  }
};

export const verifyToken = async () => {
  const response = await api.get('/api/auth/verify');
  return response.data.user;
};

// Inventory functions
export const getInventoryAreas = async () => {
  const response = await api.get('/api/inventory/areas');
  return response.data;
};

export const getInventory = async (area?: string) => {
  const params = area ? { area } : {};
  const response = await api.get('/api/inventory', { params });
  return response.data;
};

export const addInventoryItem = async (data: any) => {
  const response = await api.post('/api/inventory', data);
  return response.data;
};

export const updateInventoryItem = async (id: number, data: any) => {
  const response = await api.put(`/api/inventory/${id}`, data);
  return response.data;
};

export const discardInventoryItem = async (id: number, notes: string) => {
  const response = await api.patch(`/api/inventory/${id}/discard`, { notes });
  return response.data;
};

export const deleteInventoryItem = async (id: number) => {
  const response = await api.delete(`/api/inventory/${id}`);
  return response.data;
};

// Certificates functions
export const getCertificates = async () => {
  const response = await api.get('/api/certificates');
  return response.data;
};

export const createCertificate = async (data: any) => {
  const response = await api.post('/api/certificates', data);
  return response.data;
};

export const generateCertificatePDF = async (id: number) => {
  const response = await api.get(`/api/certificates/${id}/pdf`, {
    responseType: 'blob',
  });
  return response.data;
};

// Treatments functions
export const getTreatments = async () => {
  const response = await api.get('/api/treatments');
  return response.data;
};

export const createTreatment = async (data: any) => {
  const response = await api.post('/api/treatments', data);
  return response.data;
};

export const updateTreatment = async (id: number, data: any) => {
  const response = await api.put(`/api/treatments/${id}`, data);
  return response.data;
};

// Users functions
export const getUsers = async () => {
  const response = await api.get('/api/users');
  return response.data;
};

export const createUser = async (data: any) => {
  const response = await api.post('/api/users', data);
  return response.data;
};

export const updateUser = async (id: number, data: any) => {
  const response = await api.put(`/api/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: number) => {
  const response = await api.delete(`/api/users/${id}`);
  return response.data;
};

// Reports functions
export const getReports = async (filters?: any) => {
  const response = await api.get('/api/reports', { params: filters });
  return response.data;
};

export const generateReportPDF = async (filters?: any) => {
  const response = await api.get('/api/reports/pdf', {
    params: filters,
    responseType: 'blob',
  });
  return response.data;
};

export default api;
