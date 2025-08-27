import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import InventoryModule from './components/InventoryModule.tsx';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Login Component with real authentication
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(username, password);
      // La redirección se manejará automáticamente por el AuthProvider
    } catch (err: any) {
      // Mejorar mensaje de error para credenciales incorrectas
      const errorMessage = err.message || 'Error al iniciar sesión';
      if (errorMessage.includes('Usuario o contraseña') || errorMessage.includes('incorrectos') || errorMessage.includes('inválido')) {
        setError('Credenciales incorrectas. Inténtalo de nuevo.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-700 to-blue-900 rounded-full shadow-lg mb-6 p-4">
            <img 
              src="/imagenes/logo.png" 
              alt="Logo MIDA" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MIDA</h1>
          <p className="text-blue-700 font-semibold text-lg mb-1">
            Ministerio de Desarrollo Agropecuario
          </p>
          <p className="text-gray-600 text-sm">
            Dirección Ejecutiva de Cuarentena
          </p>
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Iniciar Sesión
          </h2>
          <p className="text-gray-600">
            Sistema de Inventarios Químicos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              placeholder="Ingrese su usuario"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
                placeholder="Ingrese su contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-700 to-blue-800 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:from-blue-800 hover:to-blue-900 transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-xs text-gray-500">
            © 2024 Ministerio de Desarrollo Agropecuario - MIDA
          </p>
        </div>
      </div>
    </div>
  );
};

// Certificates Component
const Certificates = () => {
  const [certificates, setCertificates] = useState([
    { id: 1, type: 'Fumigación', product: 'Cloruro de Sodio', date: '2024-01-15', status: 'Generado' },
    { id: 2, type: 'Aspersión', product: 'Hipoclorito de Calcio', date: '2024-01-10', status: 'Pendiente' }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Constancias</h1>
          <p className="text-gray-600">Generación de constancias de tratamiento</p>
        </div>
        <button className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg">
          + Nueva Constancia
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Constancias Generadas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {certificates.map((cert) => (
                <tr key={cert.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cert.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cert.product}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cert.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      cert.status === 'Generado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {cert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-900 mr-2">Ver</button>
                    <button className="text-green-600 hover:text-green-900">PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Treatments Component
const Treatments = () => {
  const [treatments, setTreatments] = useState([
    { id: 1, type: 'Fumigación', location: 'Puerto de Panamá', date: '2024-01-20', status: 'Programado' },
    { id: 2, type: 'Aspersión', location: 'Almacén Central', date: '2024-01-18', status: 'En Progreso' }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programación de Tratamiento</h1>
          <p className="text-gray-600">Gestión de tratamientos químicos programados</p>
        </div>
        <button className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg">
          + Programar Tratamiento
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tratamientos Programados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {treatments.map((treatment) => (
                <tr key={treatment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{treatment.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{treatment.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{treatment.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      treatment.status === 'Programado' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {treatment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-900 mr-2">Editar</button>
                    <button className="text-green-600 hover:text-green-900">Iniciar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Reports Component
const Reports = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600">Generación de reportes del sistema</p>
        </div>
        <button className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg">
          + Generar Reporte
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-blue-700 font-bold text-xl">📊</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Reporte de Inventario</h3>
              <p className="text-sm text-gray-600">Productos químicos registrados</p>
            </div>
          </div>
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors">
            Generar PDF
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-green-700 font-bold text-xl">📅</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Reporte Mensual</h3>
              <p className="text-sm text-gray-600">Actividad del mes</p>
            </div>
          </div>
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors">
            Generar PDF
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-purple-700 font-bold text-xl">📋</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Reporte de Tratamientos</h3>
              <p className="text-sm text-gray-600">Tratamientos realizados</p>
            </div>
          </div>
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors">
            Generar PDF
          </button>
        </div>
      </div>
    </div>
  );
};

// Users Component
const Users = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'Admin', role: 'Administrador', email: 'admin@mida.gob.pa', status: 'Activo' },
    { id: 2, name: 'Usuario', role: 'Operativo', email: 'user@mida.gob.pa', status: 'Activo' }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administración de usuarios del sistema</p>
        </div>
        <button className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg">
          + Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Usuarios Registrados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-900 mr-2">Editar</button>
                    <button className="text-red-600 hover:text-red-900">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Layout Component
const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                  <img 
                    src="/imagenes/logo.png" 
                    alt="Logo MIDA" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  Sistema de Inventarios Químicos
                </h1>
                <p className="text-blue-100 text-sm">
                  Ministerio de Desarrollo Agropecuario
                </p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-blue-100">
                <span className="font-medium">admin</span>
                <span className="ml-2 text-blue-200">(admin)</span>
              </div>
              <button
                onClick={() => window.location.href = '/login'}
                className="flex items-center text-blue-100 hover:text-white transition-colors"
              >
                Salir
              </button>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-600"
              >
                ☰
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-blue-800 to-blue-900 shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out`}>
          <div className="h-full flex flex-col">
            <nav className="flex-1 px-4 py-6 space-y-2">
              <Link to="/" className="block px-4 py-3 text-blue-100 hover:bg-blue-700 hover:text-white rounded-lg transition-colors">
                🏠 Inicio
              </Link>
              <Link to="/inventory" className="block px-4 py-3 text-blue-100 hover:bg-blue-700 hover:text-white rounded-lg transition-colors">
                📦 Inventario
              </Link>
              <Link to="/certificates" className="block px-4 py-3 text-blue-100 hover:bg-blue-700 hover:text-white rounded-lg transition-colors">
                📄 Constancias
              </Link>
              <Link to="/treatments" className="block px-4 py-3 text-blue-100 hover:bg-blue-700 hover:text-white rounded-lg transition-colors">
                📅 Programación de Tratamiento
              </Link>
              <Link to="/users" className="block px-4 py-3 text-blue-100 hover:bg-blue-700 hover:text-white rounded-lg transition-colors">
                👥 Gestión de Usuarios
              </Link>
              <Link to="/reports" className="block px-4 py-3 text-blue-100 hover:bg-blue-700 hover:text-white rounded-lg transition-colors">
                📊 Reportes
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-0">
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-lg">
            <span className="text-blue-700 font-bold text-2xl">🏠</span>
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Bienvenido al Sistema MIDA
            </h1>
            <p className="text-gray-600">
              Sistema de Inventarios Químicos - Dirección Ejecutiva de Cuarentena
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-blue-700 font-bold text-xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Productos en Inventario</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-green-700 font-bold text-xl">📄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Constancias Generadas</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <span className="text-yellow-700 font-bold text-xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tratamientos Programados</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-purple-700 font-bold text-xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/inventory"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-blue-600 text-xl mr-3">📦</span>
            <span className="font-medium text-gray-900">Agregar Producto</span>
          </Link>
          <Link
            to="/certificates"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-green-600 text-xl mr-3">📄</span>
            <span className="font-medium text-gray-900">Crear Constancia</span>
          </Link>
          <Link
            to="/treatments"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-yellow-600 text-xl mr-3">📅</span>
            <span className="font-medium text-gray-900">Programar Tratamiento</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// App Component
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-900 rounded-full shadow-lg mb-4 animate-spin">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">Cargando MIDA...</h2>
          <p className="text-gray-500 mt-2">Sistema de Inventarios Químicos</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Layout><InventoryModule /></Layout></ProtectedRoute>} />
        <Route path="/certificates" element={<ProtectedRoute><Layout><Certificates /></Layout></ProtectedRoute>} />
        <Route path="/treatments" element={<ProtectedRoute><Layout><Treatments /></Layout></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Layout><Users /></Layout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </Router>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
