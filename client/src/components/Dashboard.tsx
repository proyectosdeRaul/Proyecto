import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Home, Package, FileText, Calendar, BarChart3 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Productos en Inventario',
      value: '0',
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      title: 'Constancias Generadas',
      value: '0',
      icon: FileText,
      color: 'bg-green-500',
    },
    {
      title: 'Tratamientos Programados',
      value: '0',
      icon: Calendar,
      color: 'bg-yellow-500',
    },
    {
      title: 'Reportes Generados',
      value: '0',
      icon: BarChart3,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Home className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Bienvenido, {user?.username}!
            </h1>
            <p className="text-gray-600">
              Sistema de Inventarios Químicos - MIDA
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/inventory"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Package className="w-5 h-5 text-blue-600 mr-3" />
            <span className="font-medium text-gray-900">Agregar Producto</span>
          </a>
          <a
            href="/certificates"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-5 h-5 text-green-600 mr-3" />
            <span className="font-medium text-gray-900">Crear Constancia</span>
          </a>
          <a
            href="/treatments"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-5 h-5 text-yellow-600 mr-3" />
            <span className="font-medium text-gray-900">Programar Tratamiento</span>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Actividad Reciente
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-500">No hay actividad reciente</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
