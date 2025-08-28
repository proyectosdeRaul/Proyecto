import axios from 'axios';

// API Configuration - Updated for correct backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mida-backend-gpb7.onrender.com/api';

// Force correct backend URL for production
const PRODUCTION_API_URL = 'https://mida-backend-gpb7.onrender.com/api';
const FINAL_API_URL = window.location.hostname === 'mida-frontend-gpb7.onrender.com' ? PRODUCTION_API_URL : API_BASE_URL;

console.log('🔗 API Base URL configured:', FINAL_API_URL);
console.log('🌐 Current hostname:', window.location.hostname);

const api = axios.create({
  baseURL: FINAL_API_URL,
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
  console.log('🔑 Attempting login to:', FINAL_API_URL + '/auth/login');
  try {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyToken = async () => {
  const response = await api.get('/auth/verify');
  return response.data.user;
};

// Inventory functions
export const getInventoryAreas = async () => {
  const response = await api.get('/inventory/areas');
  return response.data;
};

export const getInventory = async (area?: string) => {
  const params = area ? { area } : {};
  const response = await api.get('/inventory', { params });
  return response.data;
};

export const addInventoryItem = async (data: any) => {
  const response = await api.post('/inventory', data);
  return response.data;
};

export const updateInventoryItem = async (id: number, data: any) => {
  const response = await api.put(`/inventory/${id}`, data);
  return response.data;
};

export const discardInventoryItem = async (id: number, notes: string) => {
  const response = await api.patch(`/inventory/${id}/discard`, { notes });
  return response.data;
};

export const deleteInventoryItem = async (id: number) => {
  const response = await api.delete(`/inventory/${id}`);
  return response.data;
};

// Certificates functions
export const getCertificates = async () => {
  const response = await api.get('/certificates');
  return response.data;
};

export const createCertificate = async (data: any) => {
  const response = await api.post('/certificates', data);
  return response.data;
};

export const generateCertificatePDF = async (id: number) => {
  const response = await api.get(`/certificates/${id}/pdf`, {
    responseType: 'blob',
  });
  return response.data;
};

// Treatments functions
export const getTreatments = async () => {
  const response = await api.get('/treatments');
  return response.data;
};

export const createTreatment = async (data: any) => {
  const response = await api.post('/treatments', data);
  return response.data;
};

export const updateTreatment = async (id: number, data: any) => {
  const response = await api.put(`/treatments/${id}`, data);
  return response.data;
};

// Users functions
export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const createUser = async (data: any) => {
  const response = await api.post('/users', data);
  return response.data;
};

export const updateUser = async (id: number, data: any) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: number) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

// Reports functions
export const getReports = async (filters?: any) => {
  const response = await api.get('/reports', { params: filters });
  return response.data;
};

export const generateReportPDF = async (filters?: any) => {
  const response = await api.get('/reports/pdf', {
    params: filters,
    responseType: 'blob',
  });
  return response.data;
};

export default api;
