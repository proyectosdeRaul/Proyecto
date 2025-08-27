import React from 'react';
import { Calendar, Plus } from 'lucide-react';

const Treatments: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programación de Tratamiento</h1>
          <p className="text-gray-600">Gestión de tratamientos químicos programados</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Programar Tratamiento
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay tratamientos programados</p>
        </div>
      </div>
    </div>
  );
};

export default Treatments;
