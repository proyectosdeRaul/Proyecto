import React, { useState, useEffect } from 'react';

const InventoryModule = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isAddMoreModalOpen, setIsAddMoreModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    reason: ''
  });

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('https://mida-backend-gpb7.onrender.com/api/inventory');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.log('Usando datos locales');
        setProducts([
          { id: 1, name: 'Herbicida', type: 'Químico', quantity: '20 kg', user_name: 'admin', date_added: '2024-01-15' }
        ]);
      }
    };

    loadProducts();
  }, []);

  const handleAddChemical = (newChemical: any) => {
    setProducts(prev => [newChemical, ...prev]);
  };

  const handleDiscard = (discardData: any) => {
    console.log('Descarto registrado:', discardData);
  };

  const handleAddMore = (addMoreData: any) => {
    console.log('Adición registrada:', addMoreData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600">Gestión de productos químicos y herramientas</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg"
        >
          + Añadir Item
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Items Registrados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.user_name || 'admin'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.date_added || '2024-01-15'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <input 
                  type="text" 
                  value="admin"
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
                onClick={() => {
                  const newItem = {
                    id: Date.now(),
                    name: formData.name,
                    type: 'Químico',
                    quantity: formData.quantity,
                    user_name: 'admin',
                    date_added: new Date().toLocaleDateString('es-ES')
                  };
                  setProducts(prev => [newItem, ...prev]);
                  console.log('Nuevo item añadido:', {
                    name: formData.name,
                    quantity: formData.quantity,
                    user: 'admin',
                    datetime: new Date().toLocaleString('es-ES')
                  });
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
                  value={selectedItem.name}
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
                  value="admin"
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
                onClick={() => {
                  console.log('Descartar:', {
                    item: selectedItem.name,
                    quantity: formData.quantity,
                    reason: formData.reason,
                    user: 'admin',
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
                  value={selectedItem.name}
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
                  value="admin"
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
                onClick={() => {
                  console.log('Añadir más:', {
                    item: selectedItem.name,
                    quantity: formData.quantity,
                    reason: formData.reason,
                    user: 'admin',
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
