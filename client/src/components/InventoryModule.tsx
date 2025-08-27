import React, { useState, useEffect } from 'react';

const InventoryModule = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isAddMoreModalOpen, setIsAddMoreModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

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
          { id: 1, name: 'Herbicida X', type: 'Químico', quantity: '20 kg', user_name: 'admin', date_added: '2024-01-15' },
          { id: 2, name: 'Mascarilla N95', type: 'Herramienta', quantity: '15 unidades', user_name: 'admin', date_added: '2024-01-10' }
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
              <h2 className="text-xl font-bold text-gray-900">Añadir Item</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <p className="text-gray-600">Funcionalidad de añadir item en desarrollo...</p>
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="mt-4 w-full px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal para descartar */}
      {isDiscardModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Descartar Item</h2>
              <button onClick={() => setIsDiscardModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <p className="text-gray-600">Funcionalidad de descartar en desarrollo...</p>
            <button 
              onClick={() => setIsDiscardModalOpen(false)}
              className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal para añadir más */}
      {isAddMoreModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Añadir Más</h2>
              <button onClick={() => setIsAddMoreModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <p className="text-gray-600">Funcionalidad de añadir más en desarrollo...</p>
            <button 
              onClick={() => setIsAddMoreModalOpen(false)}
              className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryModule;
