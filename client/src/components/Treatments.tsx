import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Calendar,
  MapPin,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play
} from 'lucide-react';
import { api } from '../services/api';
import { TreatmentSchedule, TreatmentStats } from '../types';

interface TreatmentFormData {
  treatment_type: string;
  chemical_name: string;
  chemical_quantity: number;
  chemical_unit: string;
  location: string;
  responsible_person: string;
  scheduled_date: string;
  scheduled_time: string;
  area_description: string;
  notes?: string;
}

const Treatments: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<TreatmentSchedule | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    status: 'all',
    location: ''
  });

  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TreatmentFormData>();

  // Fetch treatments data
  const { data: treatments, isLoading } = useQuery(
    ['treatments', filters],
    () => api.treatments.getAll(filters),
    { keepPreviousData: true }
  );

  // Fetch statistics
  const { data: stats } = useQuery(
    'treatment-stats',
    () => api.treatments.getStats()
  );

  // Fetch upcoming treatments
  const { data: upcomingTreatments } = useQuery(
    'upcoming-treatments',
    () => api.treatments.getUpcoming()
  );

  // Mutations
  const createMutation = useMutation(
    (data: TreatmentFormData) => api.treatments.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['treatments']);
        queryClient.invalidateQueries('treatment-stats');
        queryClient.invalidateQueries('upcoming-treatments');
        toast.success('Tratamiento programado exitosamente');
        setIsModalOpen(false);
        reset();
      },
      onError: () => toast.error('Error al programar el tratamiento')
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<TreatmentFormData> }) => 
      api.treatments.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['treatments']);
        queryClient.invalidateQueries('treatment-stats');
        queryClient.invalidateQueries('upcoming-treatments');
        toast.success('Tratamiento actualizado exitosamente');
        setIsModalOpen(false);
        setEditingTreatment(null);
        reset();
      },
      onError: () => toast.error('Error al actualizar el tratamiento')
    }
  );

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: number; status: string }) => api.treatments.updateStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['treatments']);
        queryClient.invalidateQueries('treatment-stats');
        queryClient.invalidateQueries('upcoming-treatments');
        toast.success('Estado del tratamiento actualizado');
      },
      onError: () => toast.error('Error al actualizar el estado')
    }
  );

  const deleteMutation = useMutation(
    (id: number) => api.treatments.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['treatments']);
        queryClient.invalidateQueries('treatment-stats');
        queryClient.invalidateQueries('upcoming-treatments');
        toast.success('Tratamiento eliminado exitosamente');
      },
      onError: () => toast.error('Error al eliminar el tratamiento')
    }
  );

  const handleFormSubmit = (data: TreatmentFormData) => {
    if (editingTreatment) {
      updateMutation.mutate({ id: editingTreatment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (treatment: TreatmentSchedule) => {
    setEditingTreatment(treatment);
    reset({
      treatment_type: treatment.treatment_type,
      chemical_name: treatment.chemical_name,
      chemical_quantity: treatment.chemical_quantity,
      chemical_unit: treatment.chemical_unit,
      location: treatment.location,
      responsible_person: treatment.responsible_person,
      scheduled_date: treatment.scheduled_date.split('T')[0],
      scheduled_time: treatment.scheduled_time,
      area_description: treatment.area_description,
      notes: treatment.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleStatusChange = (id: number, currentStatus: string) => {
    let newStatus = '';
    switch (currentStatus) {
      case 'scheduled':
        newStatus = 'in_progress';
        break;
      case 'in_progress':
        newStatus = 'completed';
        break;
      case 'completed':
        return; // Already completed
      default:
        newStatus = 'scheduled';
    }
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este tratamiento? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock size={16} className="text-blue-600" />;
      case 'in_progress':
        return <Play size={16} className="text-orange-600" />;
      case 'completed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'cancelled':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programado';
      case 'in_progress':
        return 'En Progreso';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'status-scheduled';
      case 'in_progress':
        return 'status-active';
      case 'completed':
        return 'status-active';
      case 'cancelled':
        return 'status-discarded';
      default:
        return 'status-badge';
    }
  };

  const openModal = () => {
    setEditingTreatment(null);
    reset();
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programación de Tratamientos</h1>
          <p className="text-gray-600">Gestión y seguimiento de tratamientos químicos programados</p>
        </div>
        <button
          onClick={openModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Tratamiento
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Programados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalScheduled}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Play className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Próximos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Treatments */}
      {upcomingTreatments && upcomingTreatments.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Próximos Tratamientos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTreatments.slice(0, 6).map((treatment) => (
              <div key={treatment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{treatment.chemical_name}</span>
                  <span className={`status-badge ${getStatusClass(treatment.status)}`}>
                    {getStatusText(treatment.status)}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin size={14} className="mr-2" />
                    <span className="truncate">{treatment.location}</span>
                  </div>
                  <div className="flex items-center">
                    <User size={14} className="mr-2" />
                    <span>{treatment.responsible_person}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-2" />
                    <span>{new Date(treatment.scheduled_date).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar tratamientos..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="input-field"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="input-field"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="all">Todos los estados</option>
              <option value="scheduled">Programados</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completados</option>
              <option value="cancelled">Cancelados</option>
            </select>
            <input
              type="text"
              placeholder="Ubicación"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Treatments Table */}
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
                  <th className="table-header">Número</th>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Producto Químico</th>
                  <th className="table-header">Ubicación</th>
                  <th className="table-header">Responsable</th>
                  <th className="table-header">Fecha y Hora</th>
                  <th className="table-header">Estado</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {treatments?.data?.map((treatment) => (
                  <tr key={treatment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="table-cell">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {treatment.schedule_number}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="capitalize">{treatment.treatment_type.replace('_', ' ')}</span>
                    </td>
                    <td className="table-cell">
                      <div>
                        <p className="font-medium">{treatment.chemical_name}</p>
                        <p className="text-sm text-gray-500">
                          {treatment.chemical_quantity} {treatment.chemical_unit}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <MapPin size={16} className="text-gray-400 mr-2" />
                        <span className="truncate max-w-32">{treatment.location}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <User size={16} className="text-gray-400 mr-2" />
                        <span>{treatment.responsible_person}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div>
                        <p>{new Date(treatment.scheduled_date).toLocaleDateString('es-ES')}</p>
                        <p className="text-sm text-gray-500">{treatment.scheduled_time}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(treatment.status)}
                        <span className={`status-badge ${getStatusClass(treatment.status)}`}>
                          {getStatusText(treatment.status)}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(treatment)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        {treatment.status !== 'completed' && treatment.status !== 'cancelled' && (
                          <button
                            onClick={() => handleStatusChange(treatment.id, treatment.status)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Cambiar Estado"
                          >
                            <Play size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(treatment.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!treatments?.data || treatments.data.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron tratamientos programados
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingTreatment ? 'Editar Tratamiento' : 'Nuevo Tratamiento Programado'}
            </h2>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Tratamiento *
                  </label>
                  <select
                    {...register('treatment_type', { required: 'El tipo de tratamiento es requerido' })}
                    className="input-field"
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="fumigacion">Fumigación</option>
                    <option value="aspersion">Aspersión</option>
                    <option value="inmersion">Inmersión</option>
                    <option value="aplicacion_superficial">Aplicación Superficial</option>
                    <option value="otros">Otros</option>
                  </select>
                  {errors.treatment_type && (
                    <p className="text-red-500 text-sm mt-1">{errors.treatment_type.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación *
                  </label>
                  <select
                    {...register('location', { required: 'La ubicación es requerida' })}
                    className="input-field"
                  >
                    <option value="">Seleccionar ubicación</option>
                    <option value="puerto_dentro">Dentro del Puerto</option>
                    <option value="puerto_fuera">Fuera del Puerto</option>
                    <option value="almacen">Almacén</option>
                    <option value="transporte">Transporte</option>
                    <option value="otros">Otros</option>
                  </select>
                  {errors.location && (
                    <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Producto Químico *
                  </label>
                  <input
                    {...register('chemical_name', { required: 'El nombre del producto es requerido' })}
                    className="input-field"
                    placeholder="Ej: Cloruro de Sodio"
                  />
                  {errors.chemical_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.chemical_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad *
                  </label>
                  <input
                    {...register('chemical_quantity', { 
                      required: 'La cantidad es requerida',
                      min: { value: 0, message: 'La cantidad debe ser mayor a 0' }
                    })}
                    type="number"
                    step="0.01"
                    className="input-field"
                    placeholder="0.00"
                  />
                  {errors.chemical_quantity && (
                    <p className="text-red-500 text-sm mt-1">{errors.chemical_quantity.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad *
                  </label>
                  <select
                    {...register('chemical_unit', { required: 'La unidad es requerida' })}
                    className="input-field"
                  >
                    <option value="">Seleccionar</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="l">Litros (L)</option>
                    <option value="ml">Mililitros (mL)</option>
                    <option value="g">Gramos (g)</option>
                    <option value="mg">Miligramos (mg)</option>
                    <option value="unidades">Unidades</option>
                  </select>
                  {errors.chemical_unit && (
                    <p className="text-red-500 text-sm mt-1">{errors.chemical_unit.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Programada *
                  </label>
                  <input
                    {...register('scheduled_date', { required: 'La fecha es requerida' })}
                    type="date"
                    className="input-field"
                  />
                  {errors.scheduled_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.scheduled_date.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Programada *
                  </label>
                  <input
                    {...register('scheduled_time', { required: 'La hora es requerida' })}
                    type="time"
                    className="input-field"
                  />
                  {errors.scheduled_time && (
                    <p className="text-red-500 text-sm mt-1">{errors.scheduled_time.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Persona Responsable *
                  </label>
                  <input
                    {...register('responsible_person', { required: 'La persona responsable es requerida' })}
                    className="input-field"
                    placeholder="Nombre completo del responsable"
                  />
                  {errors.responsible_person && (
                    <p className="text-red-500 text-sm mt-1">{errors.responsible_person.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción del Área *
                </label>
                <input
                  {...register('area_description', { required: 'La descripción del área es requerida' })}
                  className="input-field"
                  placeholder="Ej: Muelle 1, Área de contenedores, Zona A"
                />
                {errors.area_description && (
                  <p className="text-red-500 text-sm mt-1">{errors.area_description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas Adicionales
                </label>
                <textarea
                  {...register('notes')}
                  className="input-field"
                  rows={3}
                  placeholder="Notas adicionales sobre el tratamiento..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="btn-primary flex-1"
                >
                  {createMutation.isLoading || updateMutation.isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    editingTreatment ? 'Actualizar' : 'Programar Tratamiento'
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
    </div>
  );
};

export default Treatments;
