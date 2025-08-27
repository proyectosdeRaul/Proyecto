import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Package, 
  FileText, 
  Calendar, 
  Users, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  Shield,
  Settings,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Inicio',
      icon: Home,
      path: '/dashboard',
    },
    {
      id: 'inventory',
      label: 'Inventario y Reportes',
      icon: Package,
      path: '/inventory',
      requiredPermissions: ['inventory'],
    },
    {
      id: 'certificates',
      label: 'Constancias',
      icon: FileText,
      path: '/certificates',
      requiredPermissions: ['certificates'],
    },
    {
      id: 'treatments',
      label: 'Programación de Tratamiento',
      icon: Calendar,
      path: '/treatments',
      requiredPermissions: ['treatments'],
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: Users,
      path: '/users',
      requiredPermissions: ['users'],
      adminOnly: true,
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: BarChart3,
      path: '/reports',
      requiredPermissions: ['reports'],
    },
  ];

  const hasPermission = (permissions: string[] = []) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    return permissions.some(permission => {
      const [module, action] = permission.split(':');
      return user.permissions[module]?.includes(action);
    });
  };

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada exitosamente');
    navigate('/login');
  };

  const filteredSidebarItems = sidebarItems.filter(item => {
    if (item.adminOnly && user?.role !== 'admin') return false;
    if (item.requiredPermissions && !hasPermission(item.requiredPermissions)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-mida-600" />
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">MIDA</h1>
              <p className="text-xs text-gray-500">Sistema Químicos</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-4">
          <div className="space-y-2">
            {filteredSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`sidebar-item w-full text-left ${
                    isActive ? 'active' : ''
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <div className="h-8 w-8 bg-mida-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-mida-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="ml-4 lg:ml-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  {filteredSidebarItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                </h2>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>MIDA - Cuarentena</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
