import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  User,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Settings
} from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface UserFormData {
  username: string;
  full_name: string;
  email: string;
  role: string;
  permissions: {
    inventory: boolean;
    certificates: boolean;
    treatments: boolean;
    reports: boolean;
    users: boolean;
  };
}

interface PasswordFormData {
  password: string;
  confirmPassword: string;
}

const Users: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: 'all'
  });

  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<UserFormData>();
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors } } = useForm<PasswordFormData>();

  // Fetch users data
  const { data: users, isLoading } = useQuery(
    ['users', filters],
    () => api.users.getAll(filters),
    { keepPreviousData: true }
  );

  // Mutations
  const createMutation = useMutation(
    (data: UserFormData) => api.users.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast.success('Usuario creado exitosamente');
        setIsModalOpen(false);
        reset();
      },
      onError: () => toast.error('Error al crear el usuario')
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<UserFormData> }) => 
      api.users.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast.success('Usuario actualizado exitosamente');
        setIsModalOpen(false);
        setEditingUser(null);
        reset();
      },
      onError: () => toast.error('Error al actualizar el usuario')
    }
  );

  const updatePasswordMutation = useMutation(
    ({ id, password }: { id: number; password: string }) => 
      api.users.updatePassword(id, password),
    {
      onSuccess: () => {
        toast.success('Contraseña actualizada exitosamente');
        setIsPasswordModalOpen(false);
        setSelectedUser(null);
        resetPassword();
      },
      onError: () => toast.error('Error al actualizar la contraseña')
    }
  );

  const updatePermissionsMutation = useMutation(
    ({ id, permissions }: { id: number; permissions: any }) => 
      api.users.updatePermissions(id, permissions),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast.success('Permisos actualizados exitosamente');
        setIsPermissionsModalOpen(false);
        setSelectedUser(null);
      },
      onError: () => toast.error('Error al actualizar los permisos')
    }
  );

  const toggleStatusMutation = useMutation(
    (id: number) => api.users.toggleStatus(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast.success('Estado del usuario actualizado');
      },
      onError: () => toast.error('Error al actualizar el estado')
    }
  );

  const deleteMutation = useMutation(
    (id: number) => api.users.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast.success('Usuario eliminado exitosamente');
      },
      onError: () => toast.error('Error al eliminar el usuario')
    }
  );

  const handleFormSubmit = (data: UserFormData) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handlePasswordSubmit = (data: PasswordFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (selectedUser) {
      updatePasswordMutation.mutate({ id: selectedUser.id, password: data.password });
    }
  };

  const handlePermissionsSubmit = (data: any) => {
    if (selectedUser) {
      updatePermissionsMutation.mutate({ id: selectedUser.id, permissions: data });
    }
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    reset({
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      permissions: user.permissions || {
        inventory: false,
        certificates: false,
        treatments: false,
        reports: false,
        users: false
      }
    });
    setIsModalOpen(true);
  };

  const handlePasswordChange = (user: UserType) => {
    setSelectedUser(user);
    resetPassword();
    setIsPasswordModalOpen(true);
  };

  const handlePermissionsChange = (user: UserType) => {
    setSelectedUser(user);
    setIsPermissionsModalOpen(true);
  };

  const handleToggleStatus = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas cambiar el estado de este usuario?')) {
      toggleStatusMutation.mutate(id);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(id);
    }
  };

  const openModal = () => {
    setEditingUser(null);
    reset({
      username: '',
      full_name: '',
      email: '',
      role: 'operativo',
      permissions: {
        inventory: false,
        certificates: false,
        treatments: false,
        reports: false,
        users: false
      }
    });
    setIsModalOpen(true);
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'operativo':
        return 'Operativo';
      default:
        return 'Desconocido';
    }
  };

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'operativo':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if current user is admin
  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">No tienes permisos para acceder a la gestión de usuarios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administración de usuarios del sistema y sus permisos</p>
        </div>
        <button
          onClick={openModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Usuario
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="input-field"
            >
              <option value="">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="operativo">Operativo</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="table-header">Usuario</th>
                  <th className="table-header">Nombre Completo</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Rol</th>
                  <th className="table-header">Estado</th>
                  <th className="table-header">Último Acceso</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users?.data?.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <User size={16} className="text-gray-400 mr-2" />
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span>{user.full_name}</span>
                    </td>
                    <td className="table-cell">
                      <span className="text-gray-600">{user.email}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleClass(user.role)}`}>
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`status-badge ${user.is_active ? 'status-active' : 'status-discarded'}`}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-gray-500">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString('es-ES') : 'Nunca'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handlePasswordChange(user)}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Cambiar Contraseña"
                        >
                          <Lock size={16} />
                        </button>
                        <button
                          onClick={() => handlePermissionsChange(user)}
                          className="p-1 text-purple-600 hover:text-purple-800"
                          title="Permisos"
                        >
                          <Settings size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`p-1 ${user.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                          title={user.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {user.is_active ? <Unlock size={16} /> : <Lock size={16} />}
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!users?.data || users.data.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron usuarios
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Usuario *
                  </label>
                  <input
                    {...register('username', { required: 'El nombre de usuario es requerido' })}
                    className="input-field"
                    placeholder="usuario123"
                    disabled={!!editingUser}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    {...register('full_name', { required: 'El nombre completo es requerido' })}
                    className="input-field"
                    placeholder="Juan Pérez"
                  />
                  {errors.full_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    {...register('email', { 
                      required: 'El email es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido'
                      }
                    })}
                    type="email"
                    className="input-field"
                    placeholder="usuario@mida.gob.pa"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol *
                  </label>
                  <select
                    {...register('role', { required: 'El rol es requerido' })}
                    className="input-field"
                  >
                    <option value="">Seleccionar rol</option>
                    <option value="admin">Administrador</option>
                    <option value="operativo">Operativo</option>
                  </select>
                  {errors.role && (
                    <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
                  )}
                </div>
              </div>

              {!editingUser && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Nota:</strong> La contraseña se establecerá por defecto como "password123". 
                    El usuario deberá cambiarla en su primer inicio de sesión.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="btn-primary flex-1"
                >
                  {createMutation.isLoading || updateMutation.isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    editingUser ? 'Actualizar' : 'Crear Usuario'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Cambiar Contraseña</h2>
            <p className="text-gray-600 mb-4">Usuario: <strong>{selectedUser.username}</strong></p>
            <form onSubmit={handlePasswordSubmit(handlePasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    {...registerPassword('password', { 
                      required: 'La contraseña es requerida',
                      minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="Nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordErrors.password && (
                  <p className="text-red-500 text-sm mt-1">{passwordErrors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña *
                </label>
                <input
                  {...registerPassword('confirmPassword', { 
                    required: 'Confirma la contraseña',
                    validate: (value) => value === watch('password') || 'Las contraseñas no coinciden'
                  })}
                  type="password"
                  className="input-field"
                  placeholder="Confirmar contraseña"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={updatePasswordMutation.isLoading}
                  className="btn-primary flex-1"
                >
                  {updatePasswordMutation.isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    'Actualizar Contraseña'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {isPermissionsModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Gestionar Permisos</h2>
            <p className="text-gray-600 mb-4">Usuario: <strong>{selectedUser.username}</strong></p>
            <form onSubmit={handleSubmit(handlePermissionsSubmit)} className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={selectedUser.permissions?.inventory}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventario y Reportes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={selectedUser.permissions?.certificates}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Constancias</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={selectedUser.permissions?.treatments}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Programación de Tratamientos</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={selectedUser.permissions?.reports}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Reportes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={selectedUser.permissions?.users}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Gestión de Usuarios</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={updatePermissionsMutation.isLoading}
                  className="btn-primary flex-1"
                >
                  {updatePermissionsMutation.isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    'Actualizar Permisos'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPermissionsModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
