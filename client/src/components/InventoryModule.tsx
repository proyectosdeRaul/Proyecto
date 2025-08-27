import { useState, useEffect } from 'react';
import { getInventory, getInventoryAreas, addInventoryItem, discardInventoryItem } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

const InventoryModule = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('PPC Balboa');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isAddMoreModalOpen, setIsAddMoreModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    reason: ''
  });

  useEffect(() => {
    loadAreas();
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedArea]);

  const loadAreas = async () => {
    try {
      const areasData = await getInventoryAreas();
      setAreas(areasData);
    } catch (error) {
      console.error('Error cargando áreas:', error);
      // Áreas por defecto como fallback
      setAreas(['PPC Balboa', 'PSA', 'Chiriquí', 'Tocumen', 'Colón', 'Bocas del Toro', 'Manzanillo']);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getInventory(selectedArea);
      setProducts(data);
      setError('');
    } catch (error) {
      console.error('Error cargando inventario:', error);
      setError('Error cargando el inventario');
      // Datos de ejemplo como fallback
      setProducts([
        { 
          id: 1, 
          chemical_name: 'Herbicida', 
          quantity: 20, 
          unit: 'kg', 
          area: selectedArea,
          status: 'active',
          registered_by_name: 'admin', 
          registered_at: '2024-01-15' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChemical = async (chemicalData: any) => {
    try {
      const response = await addInventoryItem(chemicalData);
      await loadProducts(); // Recargar la lista
      console.log('Químico agregado:', response);
    } catch (error) {
      console.error('Error agregando químico:', error);
      setError('Error agregando el químico');
    }
  };

  const handleDiscard = async (discardData: any) => {
    try {
      await discardInventoryItem(selectedItem.id, discardData.reason);
      await loadProducts(); // Recargar la lista
      console.log('Descarto registrado:', discardData);
    } catch (error) {
      console.error('Error descartando químico:', error);
      setError('Error descartando el químico');
    }
  };

  const handleAddMore = async (addMoreData: any) => {
    try {
      // Por ahora solo log, más tarde implementar la lógica de añadir cantidad
      console.log('Adición registrada:', addMoreData);
    } catch (error) {
      console.error('Error añadiendo cantidad:', error);
      setError('Error añadiendo cantidad');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600">Gestión de productos químicos por área</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Área:</label>
            <select 
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg whitespace-nowrap"
          >
            + Añadir Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Items Registrados - {selectedArea}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.chemical_name || product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.quantity} {product.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      product.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status === 'active' ? 'Activo' : 'Descartado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.registered_by_name || product.user_name || user?.fullName || 'admin'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.registered_at ? new Date(product.registered_at).toLocaleDateString('es-ES') : 
                     product.date_added || '2024-01-15'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.status === 'active' && (
                      <>
                        <button 
                          onClick={() => {
                            setSelectedItem(product);
                            setIsAddMoreModalOpen(true);
                          }}
                          className="text-green-600 hover:text-green-900 mr-2"
                          title="Añadir más"
                        >
                          ➕
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedItem(product);
                            setIsDiscardModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Descartar"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para añadir item */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Añadir Nuevo Item</h2>
              <button onClick={() => {
                setIsAddModalOpen(false);
                setFormData({ name: '', quantity: '', reason: '' });
              }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del químico</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ej: Herbicida, Fungicida"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuánto está añadiendo?</label>
                <input 
                  type="text" 
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="ej: 20 kg, 15 litros"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                <input 
                  type="text" 
                  value={selectedArea}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <input 
                  type="text" 
                  value={user?.fullName || user?.username || 'admin'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
                <input 
                  type="text" 
                  value={new Date().toLocaleString('es-ES')}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setFormData({ name: '', quantity: '', reason: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  const [quantity, unit] = formData.quantity.split(' ');
                  const chemicalData = {
                    chemical_name: formData.name,
                    quantity: parseFloat(quantity) || 0,
                    unit: unit || 'kg',
                    area: selectedArea
                  };
                  await handleAddChemical(chemicalData);
                  setIsAddModalOpen(false);
                  setFormData({ name: '', quantity: '', reason: '' });
                }}
                className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                disabled={!formData.name || !formData.quantity}
              >
                Añadir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para descartar */}
      {isDiscardModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Descartar Químico</h2>
              <button onClick={() => {
                setIsDiscardModalOpen(false);
                setFormData({ name: '', quantity: '', reason: '' });
              }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Químico</label>
                <input 
                  type="text" 
                  value={selectedItem.chemical_name || selectedItem.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuánto químico se va a descartar?</label>
                <input 
                  type="text" 
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="ej: 5 kg, 10 litros"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿Por qué?</label>
                <textarea 
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Motivo del descarte"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <input 
                  type="text" 
                  value={user?.fullName || user?.username || 'admin'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
                <input 
                  type="text" 
                  value={new Date().toLocaleString('es-ES')}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => {
                  setIsDiscardModalOpen(false);
                  setFormData({ name: '', quantity: '', reason: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  await handleDiscard({
                    item: selectedItem.chemical_name || selectedItem.name,
                    quantity: formData.quantity,
                    reason: formData.reason,
                    user: user?.fullName || 'admin',
                    datetime: new Date().toLocaleString('es-ES')
                  });
                  setIsDiscardModalOpen(false);
                  setFormData({ name: '', quantity: '', reason: '' });
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                disabled={!formData.quantity || !formData.reason}
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para añadir más */}
      {isAddMoreModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Añadir Más Cantidad</h2>
              <button onClick={() => {
                setIsAddMoreModalOpen(false);
                setFormData({ name: '', quantity: '', reason: '' });
              }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Químico</label>
                <input 
                  type="text" 
                  value={selectedItem.chemical_name || selectedItem.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuánto químico se va a añadir?</label>
                <input 
                  type="text" 
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="ej: 5 kg, 10 litros"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿Por qué?</label>
                <textarea 
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Motivo de la adición"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <input 
                  type="text" 
                  value={user?.fullName || user?.username || 'admin'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
                <input 
                  type="text" 
                  value={new Date().toLocaleString('es-ES')}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => {
                  setIsAddMoreModalOpen(false);
                  setFormData({ name: '', quantity: '', reason: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  await handleAddMore({
                    item: selectedItem.chemical_name || selectedItem.name,
                    quantity: formData.quantity,
                    reason: formData.reason,
                    user: user?.fullName || 'admin',
                    datetime: new Date().toLocaleString('es-ES')
                  });
                  setIsAddMoreModalOpen(false);
                  setFormData({ name: '', quantity: '', reason: '' });
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={!formData.quantity || !formData.reason}
              >
                Añadir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryModule;
