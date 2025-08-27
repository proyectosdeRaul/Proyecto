import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Search, 
  Filter,
  Calendar,
  Package,
  User,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { ChemicalInventory, InventoryStats } from '../types';

interface InventoryFormData {
  name: string;
  quantity: number;
  unit: string;
  description?: string;
}

const Inventory: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChemicalInventory | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    status: 'all'
  });

  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InventoryFormData>();

  // Fetch inventory data
  const { data: inventory, isLoading } = useQuery(
    ['inventory', filters],
    () => api.inventory.getAll(filters),
    { keepPreviousData: true }
  );

  // Fetch statistics
  const { data: stats } = useQuery(
    'inventory-stats',
    () => api.inventory.getStats()
  );

  // Mutations
  const createMutation = useMutation(
    (data: InventoryFormData) => api.inventory.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['inventory']);
        queryClient.invalidateQueries('inventory-stats');
        toast.success('Producto químico registrado exitosamente');
        setIsModalOpen(false);
        reset();
      },
      onError: () => toast.error('Error al registrar el producto')
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<InventoryFormData> }) => 
      api.inventory.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['inventory']);
        queryClient.invalidateQueries('inventory-stats');
        toast.success('Producto actualizado exitosamente');
        setIsModalOpen(false);
        setEditingItem(null);
        reset();
      },
      onError: () => toast.error('Error al actualizar el producto')
    }
  );

  const discardMutation = useMutation(
    (id: number) => api.inventory.discard(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['inventory']);
        queryClient.invalidateQueries('inventory-stats');
        toast.success('Producto marcado como descartado');
      },
      onError: () => toast.error('Error al descartar el producto')
    }
  );

  const deleteMutation = useMutation(
    (id: number) => api.inventory.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['inventory']);
        queryClient.invalidateQueries('inventory-stats');
        toast.success('Producto eliminado exitosamente');
      },
      onError: () => toast.error('Error al eliminar el producto')
    }
  );

  const handleFormSubmit = (data: InventoryFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: ChemicalInventory) => {
    setEditingItem(item);
    reset({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      description: item.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDiscard = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas marcar este producto como descartado?')) {
      discardMutation.mutate(id);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const response = await api.reports.generateInventoryReport(filters);
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventario-quimico-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Reporte generado exitosamente');
    } catch (error) {
      toast.error('Error al generar el reporte');
    }
  };

  const openModal = () => {
    setEditingItem(null);
    reset();
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario Químico</h1>
          <p className="text-gray-600">Gestión de productos químicos para tratamientos cuarentenarios</p>
        </div>
        <button
          onClick={openModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeItems}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Descartados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.discardedItems}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Este Mes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.itemsThisMonth}</p>
              </div>
            </div>
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
                placeholder="Buscar productos..."
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
              <option value="active">Activos</option>
              <option value="discarded">Descartados</option>
            </select>
            <button
              onClick={handleGenerateReport}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={20} />
              Reporte PDF
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
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
                  <th className="table-header">Producto</th>
                  <th className="table-header">Cantidad</th>
                  <th className="table-header">Registrado por</th>
                  <th className="table-header">Fecha</th>
                  <th className="table-header">Estado</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inventory?.data?.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500">{item.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-medium">{item.quantity} {item.unit}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <User size={16} className="text-gray-400 mr-2" />
                        <span>{item.registrant_name}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      {new Date(item.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="table-cell">
                      <span className={`status-badge ${item.is_discarded ? 'status-discarded' : 'status-active'}`}>
                        {item.is_discarded ? 'Descartado' : 'Activo'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        {!item.is_discarded && (
                          <button
                            onClick={() => handleDiscard(item.id)}
                            className="p-1 text-orange-600 hover:text-orange-800"
                            title="Descartar"
                          >
                            <AlertTriangle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
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
            {(!inventory?.data || inventory.data.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron productos químicos
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? 'Editar Producto' : 'Nuevo Producto Químico'}
            </h2>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  {...register('name', { required: 'El nombre es requerido' })}
                  className="input-field"
                  placeholder="Ej: Cloruro de Sodio"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad *
                  </label>
                  <input
                    {...register('quantity', { 
                      required: 'La cantidad es requerida',
                      min: { value: 0, message: 'La cantidad debe ser mayor a 0' }
                    })}
                    type="number"
                    step="0.01"
                    className="input-field"
                    placeholder="0.00"
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad *
                  </label>
                  <select
                    {...register('unit', { required: 'La unidad es requerida' })}
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
                  {errors.unit && (
                    <p className="text-red-500 text-sm mt-1">{errors.unit.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  {...register('description')}
                  className="input-field"
                  rows={3}
                  placeholder="Descripción opcional del producto..."
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
                    editingItem ? 'Actualizar' : 'Registrar'
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

export default Inventory;
