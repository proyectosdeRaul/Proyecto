import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Package, 
  FileText, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';
import { InventoryStats, TreatmentStats, TreatmentSchedule } from '../types';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [treatmentStats, setTreatmentStats] = useState<TreatmentStats | null>(null);
  const [upcomingTreatments, setUpcomingTreatments] = useState<TreatmentSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [inventoryData, treatmentData, upcomingData] = await Promise.all([
          apiService.getInventoryStats(),
          apiService.getTreatmentStats(),
          apiService.getUpcomingTreatments()
        ]);

        setInventoryStats(inventoryData);
        setTreatmentStats(treatmentData);
        setUpcomingTreatments(upcomingData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Error al cargar los datos del dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <div className="card p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const QuickActionCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    color: string;
  }> = ({ title, description, icon, onClick, color }) => (
    <button
      onClick={onClick}
      className="card p-6 text-left hover:shadow-lg transition-shadow duration-200 group"
    >
      <div className={`inline-flex p-3 rounded-lg ${color} group-hover:scale-110 transition-transform duration-200`}>
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mida-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="card p-6 bg-gradient-to-r from-mida-600 to-mida-700 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Bienvenido, {user?.fullName}
        </h1>
        <p className="text-mida-100">
          Sistema de Inventarios Químicos - Ministerio de Desarrollo Agropecuario
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Productos Químicos"
          value={inventoryStats?.totalChemicals || 0}
          icon={<Package className="h-6 w-6 text-white" />}
          color="bg-blue-500"
          subtitle={`${inventoryStats?.activeChemicals || 0} activos`}
        />
        <StatCard
          title="Tratamientos Programados"
          value={treatmentStats?.totalTreatments || 0}
          icon={<Calendar className="h-6 w-6 text-white" />}
          color="bg-green-500"
          subtitle={`${treatmentStats?.completedTreatments || 0} completados`}
        />
        <StatCard
          title="Certificados Generados"
          value="0"
          icon={<FileText className="h-6 w-6 text-white" />}
          color="bg-purple-500"
          subtitle="Este mes"
        />
        <StatCard
          title="Tratamientos Pendientes"
          value={treatmentStats?.scheduledTreatments || 0}
          icon={<Clock className="h-6 w-6 text-white" />}
          color="bg-orange-500"
          subtitle={`${treatmentStats?.overdueTreatments || 0} vencidos`}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickActionCard
          title="Registrar Producto Químico"
          description="Agregar un nuevo producto al inventario"
          icon={<Plus className="h-6 w-6 text-white" />}
          onClick={() => {/* Navigate to inventory form */}}
          color="bg-blue-500"
        />
        <QuickActionCard
          title="Crear Certificado"
          description="Generar certificado de tratamiento"
          icon={<FileText className="h-6 w-6 text-white" />}
          onClick={() => {/* Navigate to certificate form */}}
          color="bg-purple-500"
        />
        <QuickActionCard
          title="Programar Tratamiento"
          description="Agendar nuevo tratamiento químico"
          icon={<Calendar className="h-6 w-6 text-white" />}
          onClick={() => {/* Navigate to treatment form */}}
          color="bg-green-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Treatments */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-mida-600" />
              Próximos Tratamientos
            </h3>
          </div>
          <div className="p-6">
            {upcomingTreatments.length > 0 ? (
              <div className="space-y-4">
                {upcomingTreatments.slice(0, 5).map((treatment) => (
                  <div key={treatment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{treatment.treatmentType}</p>
                      <p className="text-sm text-gray-600">{treatment.locationName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(treatment.scheduledDate).toLocaleDateString()}
                      </p>
                      <span className={`status-badge status-${treatment.status}`}>
                        {treatment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay tratamientos programados</p>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-mida-600" />
              Estado del Sistema
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Productos Activos</span>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="font-medium">{inventoryStats?.activeChemicals || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Productos Vencidos</span>
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="font-medium">{inventoryStats?.expiredChemicals || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Tratamientos en Progreso</span>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-orange-500 mr-2" />
                  <span className="font-medium">{treatmentStats?.inProgressTreatments || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Tratamientos Vencidos</span>
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="font-medium">{treatmentStats?.overdueTreatments || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Section */}
      {user?.role === 'admin' && (
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Panel de Administración</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="btn-secondary">
                Gestionar Usuarios
              </button>
              <button className="btn-secondary">
                Configurar Permisos
              </button>
              <button className="btn-secondary">
                Generar Reportes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
