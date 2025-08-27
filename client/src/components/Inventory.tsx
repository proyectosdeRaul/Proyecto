import React, { useState, useEffect } from 'react';

// Modal Component for Add Chemical
const AddChemicalModal = ({ isOpen, onClose, onAdd }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAdd: (chemical: any) => void; 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    quantity: '',
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date();
    const chemicalData = {
      ...formData,
      user: 'admin',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      status: 'Activo'
    };

    try {
      const response = await fetch('https://mida-backend-gpb7.onrender.com/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chemicalData),
      });

      if (response.ok) {
        const savedChemical = await response.json();
        onAdd(savedChemical);
        setFormData({ name: '', type: '', quantity: '', reason: '' });
        onClose();
      } else {
        console.error('Error al guardar el químico');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      onAdd({ id: Date.now(), ...chemicalData });
      setFormData({ name: '', type: '', quantity: '', reason: '' });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Añadir Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Item *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              placeholder="Ej: Cloruro de Sodio, Mascarilla N95"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              required
            >
              <option value="">Seleccionar tipo</option>
              <option value="Químico">Químico</option>
              <option value="Herramienta">Herramienta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
            <input
              type="text"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              placeholder="Ej: 50 kg, 25 L, 10 unidades"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de Adición *</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              placeholder="Explique el motivo por el cual se añade este item"
              rows={3}
              required
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">
              <p><strong>Usuario:</strong> admin</p>
              <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Hora:</strong> {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800">
              Añadir Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal Component for Discard
const DiscardModal = ({ isOpen, onClose, onDiscard, item }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onDiscard: (data: any) => void;
  item: any;
}) => {
  const [formData, setFormData] = useState({
    quantity_discarded: '',
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`https://mida-backend-gpb7.onrender.com/api/inventory/${item.id}/discard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onDiscard(formData);
        setFormData({ quantity_discarded: '', reason: '' });
        onClose();
      }
    } catch (error) {
      console.error('Error al registrar descarte:', error);
      onDiscard(formData);
      setFormData({ quantity_discarded: '', reason: '' });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Descartar Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700"><strong>Item:</strong> {item?.name}</p>
          <p className="text-sm text-gray-700"><strong>Cantidad actual:</strong> {item?.quantity}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a Descartar *</label>
            <input
              type="text"
              value={formData.quantity_discarded}
              onChange={(e) => setFormData({...formData, quantity_discarded: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              placeholder="Ej: 5 kg, 2 L, 3 unidades"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del Descarto *</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              placeholder="Explique el motivo por el cual se descarta este item"
              rows={3}
              required
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">
              <p><strong>Usuario:</strong> admin</p>
              <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Hora:</strong> {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Registrar Descarto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal Component for Add More
const AddMoreModal = ({ isOpen, onClose, onAddMore, item }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAddMore: (data: any) => void;
  item: any;
}) => {
  const [formData, setFormData] = useState({
    quantity_added: '',
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`https://mida-backend-gpb7.onrender.com/api/inventory/${item.id}/add-more`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onAddMore(formData);
        setFormData({ quantity_added: '', reason: '' });
        onClose();
      }
    } catch (error) {
      console.error('Error al registrar adición:', error);
      onAddMore(formData);
      setFormData({ quantity_added: '', reason: '' });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Añadir Más</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-700"><strong>Item:</strong> {item?.name}</p>
          <p className="text-sm text-gray-700"><strong>Cantidad actual:</strong> {item?.quantity}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a Añadir *</label>
            <input
              type="text"
              value={formData.quantity_added}
              onChange={(e) => setFormData({...formData, quantity_added: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              placeholder="Ej: 10 kg, 5 L, 2 unidades"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de la Adición *</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              placeholder="Explique el motivo por el cual se añade más cantidad"
              rows={3}
              required
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">
              <p><strong>Usuario:</strong> admin</p>
              <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Hora:</strong> {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Registrar Adición
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Inventory Component
const Inventory = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isAddMoreModalOpen, setIsAddMoreModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Load products from backend
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
    // Aquí podrías actualizar la cantidad del item si es necesario
  };

  const handleAddMore = (addMoreData: any) => {
    console.log('Adición registrada:', addMoreData);
    // Aquí podrías actualizar la cantidad del item si es necesario
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

      <AddChemicalModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddChemical}
      />

      <DiscardModal 
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onDiscard={handleDiscard}
        item={selectedItem}
      />

      <AddMoreModal 
        isOpen={isAddMoreModalOpen}
        onClose={() => setIsAddMoreModalOpen(false)}
        onAddMore={handleAddMore}
        item={selectedItem}
      />
    </div>
  );
};

export default Inventory;
