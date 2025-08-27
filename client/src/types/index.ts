export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: 'admin' | 'user';
  permissions: Record<string, string[]>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChemicalInventory {
  id: number;
  chemicalName: string;
  quantity: number;
  unit: string;
  concentration?: string;
  manufacturer?: string;
  lotNumber?: string;
  expirationDate?: string;
  storageLocation?: string;
  status: 'active' | 'discarded' | 'expired';
  registeredBy: number;
  registeredByName?: string;
  registeredAt: string;
  discardedAt?: string;
  discardedBy?: number;
  notes?: string;
}

export interface TreatmentCertificate {
  id: number;
  certificateNumber: string;
  treatmentType: string;
  productName: string;
  applicationLocation: string;
  responsiblePerson: string;
  applicationDate: string;
  applicationTime: string;
  chemicalUsed?: string;
  concentrationUsed?: string;
  quantityUsed?: number;
  unitUsed?: string;
  weatherConditions?: string;
  temperature?: number;
  humidity?: number;
  observations?: string;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TreatmentSchedule {
  id: number;
  scheduleNumber: string;
  treatmentType: string;
  locationType: 'puerto' | 'fuera_puerto';
  locationName: string;
  chemicalName: string;
  quantityPlanned: number;
  unit: string;
  scheduledDate: string;
  scheduledTime: string;
  responsiblePerson: string;
  areaSize?: number;
  areaUnit?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completedBy?: number;
  completedByName?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  details?: any[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InventoryStats {
  totalChemicals: number;
  activeChemicals: number;
  discardedChemicals: number;
  expiredChemicals: number;
  totalQuantity: number;
}

export interface TreatmentStats {
  totalTreatments: number;
  scheduledTreatments: number;
  inProgressTreatments: number;
  completedTreatments: number;
  cancelledTreatments: number;
  overdueTreatments: number;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  treatmentType?: string;
  locationType?: string;
  format?: 'pdf' | 'json';
}

export interface ReportType {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  filters: string[];
}

export interface MonthlyReport {
  period: string;
  inventory: InventoryStats;
  certificates: { totalCertificates: number };
  treatments: TreatmentStats;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'select' | 'textarea';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  requiredPermissions?: string[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}
