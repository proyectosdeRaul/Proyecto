import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  ChemicalInventory, 
  TreatmentCertificate, 
  TreatmentSchedule,
  LoginCredentials,
  AuthResponse,
  ApiResponse,
  InventoryStats,
  TreatmentStats,
  ReportFilters,
  ReportType,
  MonthlyReport
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
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

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async verifyToken(): Promise<{ valid: boolean; user: User }> {
    const response: AxiosResponse<{ valid: boolean; user: User }> = await this.api.get('/auth/verify');
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  // Inventory endpoints
  async getInventory(filters?: { status?: string; search?: string }): Promise<ChemicalInventory[]> {
    const response: AxiosResponse<ChemicalInventory[]> = await this.api.get('/inventory', { params: filters });
    return response.data;
  }

  async getInventoryItem(id: number): Promise<ChemicalInventory> {
    const response: AxiosResponse<ChemicalInventory> = await this.api.get(`/inventory/${id}`);
    return response.data;
  }

  async createInventoryItem(data: Partial<ChemicalInventory>): Promise<{ message: string; chemical: ChemicalInventory }> {
    const response: AxiosResponse<{ message: string; chemical: ChemicalInventory }> = await this.api.post('/inventory', data);
    return response.data;
  }

  async updateInventoryItem(id: number, data: Partial<ChemicalInventory>): Promise<{ message: string; chemical: ChemicalInventory }> {
    const response: AxiosResponse<{ message: string; chemical: ChemicalInventory }> = await this.api.put(`/inventory/${id}`, data);
    return response.data;
  }

  async discardInventoryItem(id: number, notes?: string): Promise<{ message: string; chemical: ChemicalInventory }> {
    const response: AxiosResponse<{ message: string; chemical: ChemicalInventory }> = await this.api.patch(`/inventory/${id}/discard`, { notes });
    return response.data;
  }

  async deleteInventoryItem(id: number): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/inventory/${id}`);
    return response.data;
  }

  async getInventoryStats(): Promise<InventoryStats> {
    const response: AxiosResponse<InventoryStats> = await this.api.get('/inventory/stats/overview');
    return response.data;
  }

  // Certificates endpoints
  async getCertificates(filters?: { start_date?: string; end_date?: string; treatment_type?: string }): Promise<TreatmentCertificate[]> {
    const response: AxiosResponse<TreatmentCertificate[]> = await this.api.get('/certificates', { params: filters });
    return response.data;
  }

  async getCertificate(id: number): Promise<TreatmentCertificate> {
    const response: AxiosResponse<TreatmentCertificate> = await this.api.get(`/certificates/${id}`);
    return response.data;
  }

  async createCertificate(data: Partial<TreatmentCertificate>): Promise<{ message: string; certificate: TreatmentCertificate }> {
    const response: AxiosResponse<{ message: string; certificate: TreatmentCertificate }> = await this.api.post('/certificates', data);
    return response.data;
  }

  async updateCertificate(id: number, data: Partial<TreatmentCertificate>): Promise<{ message: string; certificate: TreatmentCertificate }> {
    const response: AxiosResponse<{ message: string; certificate: TreatmentCertificate }> = await this.api.put(`/certificates/${id}`, data);
    return response.data;
  }

  async deleteCertificate(id: number): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/certificates/${id}`);
    return response.data;
  }

  async generateCertificatePDF(id: number): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get(`/certificates/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Treatments endpoints
  async getTreatments(filters?: { status?: string; location_type?: string; start_date?: string; end_date?: string }): Promise<TreatmentSchedule[]> {
    const response: AxiosResponse<TreatmentSchedule[]> = await this.api.get('/treatments', { params: filters });
    return response.data;
  }

  async getTreatment(id: number): Promise<TreatmentSchedule> {
    const response: AxiosResponse<TreatmentSchedule> = await this.api.get(`/treatments/${id}`);
    return response.data;
  }

  async createTreatment(data: Partial<TreatmentSchedule>): Promise<{ message: string; treatment: TreatmentSchedule }> {
    const response: AxiosResponse<{ message: string; treatment: TreatmentSchedule }> = await this.api.post('/treatments', data);
    return response.data;
  }

  async updateTreatment(id: number, data: Partial<TreatmentSchedule>): Promise<{ message: string; treatment: TreatmentSchedule }> {
    const response: AxiosResponse<{ message: string; treatment: TreatmentSchedule }> = await this.api.put(`/treatments/${id}`, data);
    return response.data;
  }

  async updateTreatmentStatus(id: number, status: string): Promise<{ message: string; treatment: TreatmentSchedule }> {
    const response: AxiosResponse<{ message: string; treatment: TreatmentSchedule }> = await this.api.patch(`/treatments/${id}/status`, { status });
    return response.data;
  }

  async deleteTreatment(id: number): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/treatments/${id}`);
    return response.data;
  }

  async getTreatmentStats(): Promise<TreatmentStats> {
    const response: AxiosResponse<TreatmentStats> = await this.api.get('/treatments/stats/overview');
    return response.data;
  }

  async getUpcomingTreatments(): Promise<TreatmentSchedule[]> {
    const response: AxiosResponse<TreatmentSchedule[]> = await this.api.get('/treatments/upcoming/list');
    return response.data;
  }

  // Users endpoints (admin only)
  async getUsers(): Promise<User[]> {
    const response: AxiosResponse<User[]> = await this.api.get('/users');
    return response.data;
  }

  async getUser(id: number): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get(`/users/${id}`);
    return response.data;
  }

  async createUser(data: Partial<User & { password: string }>): Promise<{ message: string; user: User }> {
    const response: AxiosResponse<{ message: string; user: User }> = await this.api.post('/users', data);
    return response.data;
  }

  async updateUser(id: number, data: Partial<User>): Promise<{ message: string; user: User }> {
    const response: AxiosResponse<{ message: string; user: User }> = await this.api.put(`/users/${id}`, data);
    return response.data;
  }

  async changeUserPassword(id: number, newPassword: string): Promise<{ message: string; user: User }> {
    const response: AxiosResponse<{ message: string; user: User }> = await this.api.patch(`/users/${id}/password`, { newPassword });
    return response.data;
  }

  async toggleUserStatus(id: number): Promise<{ message: string; user: User }> {
    const response: AxiosResponse<{ message: string; user: User }> = await this.api.patch(`/users/${id}/toggle-status`);
    return response.data;
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/users/${id}`);
    return response.data;
  }

  async updateUserPermissions(id: number, permissions: Record<string, string[]>): Promise<{ message: string; user: User }> {
    const response: AxiosResponse<{ message: string; user: User }> = await this.api.put(`/users/${id}/permissions`, { permissions });
    return response.data;
  }

  // Profile endpoints
  async getProfile(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/users/profile/me');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<{ message: string; user: User }> {
    const response: AxiosResponse<{ message: string; user: User }> = await this.api.put('/users/profile/me', data);
    return response.data;
  }

  // Reports endpoints
  async getReportTypes(): Promise<ReportType[]> {
    const response: AxiosResponse<ReportType[]> = await this.api.get('/reports/types');
    return response.data;
  }

  async generateInventoryReport(filters: ReportFilters): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get('/reports/inventory', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }

  async generateCertificatesReport(filters: ReportFilters): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get('/reports/certificates', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }

  async generateTreatmentsReport(filters: ReportFilters): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get('/reports/treatments', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }

  async generateMonthlyReport(year: string, month: string, format?: string): Promise<Blob | MonthlyReport> {
    const response: AxiosResponse<Blob | MonthlyReport> = await this.api.get(`/reports/monthly/${year}/${month}`, {
      params: { format },
      responseType: format === 'json' ? 'json' : 'blob',
    });
    return response.data;
  }

  // Utility methods
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const apiService = new ApiService();
export default apiService;
