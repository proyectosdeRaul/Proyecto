import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Search, 
  FileText,
  Calendar,
  MapPin,
  User,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { TreatmentCertificate } from '../types';

interface CertificateFormData {
  treatment_type: string;
  product_name: string;
  product_quantity: number;
  product_unit: string;
  application_location: string;
  responsible_person: string;
  treatment_date: string;
  observations?: string;
}

const Certificates: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<TreatmentCertificate | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    treatment_type: ''
  });

  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CertificateFormData>();

  // Fetch certificates data
  const { data: certificates, isLoading } = useQuery(
    ['certificates', filters],
    () => api.certificates.getAll(filters),
    { keepPreviousData: true }
  );

  // Mutations
  const createMutation = useMutation(
    (data: CertificateFormData) => api.certificates.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['certificates']);
        toast.success('Constancia de tratamiento creada exitosamente');
        setIsModalOpen(false);
        reset();
      },
      onError: () => toast.error('Error al crear la constancia')
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<CertificateFormData> }) => 
      api.certificates.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['certificates']);
        toast.success('Constancia actualizada exitosamente');
        setIsModalOpen(false);
        setEditingCertificate(null);
        reset();
      },
      onError: () => toast.error('Error al actualizar la constancia')
    }
  );

  const deleteMutation = useMutation(
    (id: number) => api.certificates.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['certificates']);
        toast.success('Constancia eliminada exitosamente');
      },
      onError: () => toast.error('Error al eliminar la constancia')
    }
  );

  const handleFormSubmit = (data: CertificateFormData) => {
    if (editingCertificate) {
      updateMutation.mutate({ id: editingCertificate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (certificate: TreatmentCertificate) => {
    setEditingCertificate(certificate);
    reset({
      treatment_type: certificate.treatment_type,
      product_name: certificate.product_name,
      product_quantity: certificate.product_quantity,
      product_unit: certificate.product_unit,
      application_location: certificate.application_location,
      responsible_person: certificate.responsible_person,
      treatment_date: certificate.treatment_date.split('T')[0],
      observations: certificate.observations || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta constancia? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleGeneratePDF = async (id: number) => {
    try {
      const response = await api.certificates.generatePDF(id);
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `constancia-tratamiento-${id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      toast.error('Error al generar el PDF');
    }
  };

  const handleViewCertificate = (certificate: TreatmentCertificate) => {
    // Open certificate in a new modal for viewing
    setEditingCertificate(certificate);
    setIsModalOpen(true);
  };

  const openModal = () => {
    setEditingCertificate(null);
    reset();
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Constancias de Tratamiento</h1>
          <p className="text-gray-600">Generación y gestión de constancias oficiales de tratamientos cuarentenarios</p>
        </div>
        <button
          onClick={openModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Constancia
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
                placeholder="Buscar constancias..."
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
              value={filters.treatment_type}
              onChange={(e) => setFilters({ ...filters, treatment_type: e.target.value })}
              className="input-field"
            >
              <option value="">Todos los tipos</option>
              <option value="fumigacion">Fumigación</option>
              <option value="aspersion">Aspersión</option>
              <option value="inmersion">Inmersión</option>
              <option value="aplicacion_superficial">Aplicación Superficial</option>
              <option value="otros">Otros</option>
            </select>
          </div>
        </div>
      </div>

      {/* Certificates Table */}
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
                  <th className="table-header">Tipo de Tratamiento</th>
                  <th className="table-header">Producto</th>
                  <th className="table-header">Ubicación</th>
                  <th className="table-header">Responsable</th>
                  <th className="table-header">Fecha</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {certificates?.data?.map((certificate) => (
                  <tr key={certificate.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="table-cell">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {certificate.certificate_number}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="capitalize">{certificate.treatment_type.replace('_', ' ')}</span>
                    </td>
                    <td className="table-cell">
                      <div>
                        <p className="font-medium">{certificate.product_name}</p>
                        <p className="text-sm text-gray-500">
                          {certificate.product_quantity} {certificate.product_unit}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <MapPin size={16} className="text-gray-400 mr-2" />
                        <span className="truncate max-w-32">{certificate.application_location}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <User size={16} className="text-gray-400 mr-2" />
                        <span>{certificate.responsible_person}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      {new Date(certificate.treatment_date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewCertificate(certificate)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Ver"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(certificate)}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleGeneratePDF(certificate.id)}
                          className="p-1 text-purple-600 hover:text-purple-800"
                          title="Descargar PDF"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(certificate.id)}
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
            {(!certificates?.data || certificates.data.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron constancias de tratamiento
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
              {editingCertificate ? 'Editar Constancia' : 'Nueva Constancia de Tratamiento'}
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
                    Fecha de Tratamiento *
                  </label>
                  <input
                    {...register('treatment_date', { required: 'La fecha es requerida' })}
                    type="date"
                    className="input-field"
                  />
                  {errors.treatment_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.treatment_date.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    {...register('product_name', { required: 'El nombre del producto es requerido' })}
                    className="input-field"
                    placeholder="Ej: Cloruro de Sodio"
                  />
                  {errors.product_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.product_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad *
                  </label>
                  <input
                    {...register('product_quantity', { 
                      required: 'La cantidad es requerida',
                      min: { value: 0, message: 'La cantidad debe ser mayor a 0' }
                    })}
                    type="number"
                    step="0.01"
                    className="input-field"
                    placeholder="0.00"
                  />
                  {errors.product_quantity && (
                    <p className="text-red-500 text-sm mt-1">{errors.product_quantity.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad *
                  </label>
                  <select
                    {...register('product_unit', { required: 'La unidad es requerida' })}
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
                  {errors.product_unit && (
                    <p className="text-red-500 text-sm mt-1">{errors.product_unit.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación de Aplicación *
                  </label>
                  <input
                    {...register('application_location', { required: 'La ubicación es requerida' })}
                    className="input-field"
                    placeholder="Ej: Puerto de Panamá, Muelle 1"
                  />
                  {errors.application_location && (
                    <p className="text-red-500 text-sm mt-1">{errors.application_location.message}</p>
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
                  Observaciones
                </label>
                <textarea
                  {...register('observations')}
                  className="input-field"
                  rows={3}
                  placeholder="Observaciones adicionales del tratamiento..."
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
                    editingCertificate ? 'Actualizar' : 'Crear Constancia'
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

export default Certificates;
