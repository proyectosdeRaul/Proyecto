import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import { 
  Download, 
  Calendar,
  FileText,
  BarChart3,
  TrendingUp,
  Filter,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  type: string;
  format: 'pdf' | 'json';
}

const Reports: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: '',
    dateTo: '',
    type: 'inventory',
    format: 'pdf'
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch report types
  const { data: reportTypes } = useQuery(
    'report-types',
    () => api.reports.getTypes()
  );

  const handleGenerateReport = async () => {
    if (!filters.dateFrom || !filters.dateTo) {
      toast.error('Por favor selecciona un rango de fechas');
      return;
    }

    setIsGenerating(true);
    try {
      let response;
      
      switch (filters.type) {
        case 'inventory':
          response = await api.reports.generateInventoryReport(filters);
          break;
        case 'certificates':
          response = await api.reports.generateCertificatesReport(filters);
          break;
        case 'treatments':
          response = await api.reports.generateTreatmentsReport(filters);
          break;
        case 'monthly':
          const [year, month] = filters.dateFrom.split('-');
          response = await api.reports.generateMonthlyReport(parseInt(year), parseInt(month));
          break;
        default:
          throw new Error('Tipo de reporte no válido');
      }

      if (filters.format === 'pdf') {
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte-${filters.type}-${filters.dateFrom}-${filters.dateTo}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        // For JSON format, we would handle it differently
        const jsonData = JSON.stringify(response, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte-${filters.type}-${filters.dateFrom}-${filters.dateTo}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      }

      toast.success('Reporte generado exitosamente');
    } catch (error) {
      toast.error('Error al generar el reporte');
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMonthlyReport = async () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    setIsGenerating(true);
    try {
      const response = await api.reports.generateMonthlyReport(year, month);
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-mensual-${year}-${month.toString().padStart(2, '0')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Reporte mensual generado exitosamente');
    } catch (error) {
      toast.error('Error al generar el reporte mensual');
      console.error('Error generating monthly report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getReportTypeInfo = (type: string) => {
    switch (type) {
      case 'inventory':
        return {
          title: 'Reporte de Inventario',
          description: 'Listado completo de productos químicos registrados',
          icon: <BarChart3 className="w-6 h-6" />
        };
      case 'certificates':
        return {
          title: 'Reporte de Constancias',
          description: 'Constancias de tratamiento generadas',
          icon: <FileText className="w-6 h-6" />
        };
      case 'treatments':
        return {
          title: 'Reporte de Tratamientos',
          description: 'Programación y seguimiento de tratamientos',
          icon: <TrendingUp className="w-6 h-6" />
        };
      case 'monthly':
        return {
          title: 'Reporte Mensual',
          description: 'Resumen completo del mes',
          icon: <Calendar className="w-6 h-6" />
        };
      default:
        return {
          title: 'Reporte',
          description: 'Reporte del sistema',
          icon: <FileText className="w-6 h-6" />
        };
    }
  };

  const reportInfo = getReportTypeInfo(filters.type);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generación de Reportes</h1>
          <p className="text-gray-600">Genera reportes detallados de todas las actividades del sistema</p>
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div 
          className={`card cursor-pointer transition-all ${filters.type === 'inventory' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
          onClick={() => setFilters({ ...filters, type: 'inventory' })}
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">Inventario</p>
              <p className="text-sm text-gray-600">Productos químicos</p>
            </div>
          </div>
        </div>

        <div 
          className={`card cursor-pointer transition-all ${filters.type === 'certificates' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
          onClick={() => setFilters({ ...filters, type: 'certificates' })}
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <FileText className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">Constancias</p>
              <p className="text-sm text-gray-600">Tratamientos realizados</p>
            </div>
          </div>
        </div>

        <div 
          className={`card cursor-pointer transition-all ${filters.type === 'treatments' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
          onClick={() => setFilters({ ...filters, type: 'treatments' })}
        >
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">Tratamientos</p>
              <p className="text-sm text-gray-600">Programación y seguimiento</p>
            </div>
          </div>
        </div>

        <div 
          className={`card cursor-pointer transition-all ${filters.type === 'monthly' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
          onClick={() => setFilters({ ...filters, type: 'monthly' })}
        >
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">Mensual</p>
              <p className="text-sm text-gray-600">Resumen completo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="card mb-6">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mr-3">
            {reportInfo.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{reportInfo.title}</h3>
            <p className="text-sm text-gray-600">{reportInfo.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Desde *
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Hasta *
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Formato
            </label>
            <select
              value={filters.format}
              onChange={(e) => setFilters({ ...filters, format: e.target.value as 'pdf' | 'json' })}
              className="input-field"
            >
              <option value="pdf">PDF</option>
              <option value="json">JSON</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || !filters.dateFrom || !filters.dateTo}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isGenerating ? 'Generando...' : 'Generar Reporte'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Report Quick Action */}
        <div className="card">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600 mr-3">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reporte Mensual Automático</h3>
              <p className="text-sm text-gray-600">Genera el reporte del mes actual</p>
            </div>
          </div>
          <button
            onClick={handleGenerateMonthlyReport}
            disabled={isGenerating}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isGenerating ? 'Generando...' : 'Reporte del Mes Actual'}
          </button>
        </div>

        {/* Report Information */}
        <div className="card">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mr-3">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Información de Reportes</h3>
              <p className="text-sm text-gray-600">Detalles sobre los tipos de reportes</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <span>Los reportes incluyen filtros por fecha</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Formato PDF para impresión oficial</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
              <span>Datos completos y estadísticas</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              <span>Descarga automática al navegador</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Types Information */}
      {reportTypes && (
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Reportes Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((type: any) => (
              <div key={type.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FileText className="w-5 h-5 text-blue-600 mr-2" />
                  <h4 className="font-medium text-gray-900">{type.name}</h4>
                </div>
                <p className="text-sm text-gray-600">{type.description}</p>
                <div className="mt-2 text-xs text-gray-500">
                  Incluye: {type.includes?.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
