import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ArrowLongRightIcon, 
  UserIcon, 
  CalendarDaysIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/solid';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const InventoryLogsModal = ({ productId, productName, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Determinar si es reporte general o específico
  const isGeneral = !productId;
  const title = isGeneral ? 'Historial General de Movimientos' : `Kardex: ${productName}`;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Endpoint dinámico según el caso
        const endpoint = isGeneral 
            ? `${API_URL}/api/products/inventory-logs`
            : `${API_URL}/api/products/${productId}/inventory-logs`;

        const res = await fetch(endpoint, { credentials: 'include' });
        const data = await res.json();

        if (data.success) {
          setLogs(data.data);
        }
      } catch (error) {
        console.error("Error cargando logs", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [productId, isGeneral]);

  // Helpers de formato
  const formatDate = (date) => new Date(date).toLocaleString('es-MX');
  
  const getBadge = (type) => {
    switch (type) {
        case 'add': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">Entrada</span>;
        case 'subtract': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">Salida</span>;
        case 'set': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">Ajuste</span>;
        default: return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600"/>
                {title}
            </h2>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <XMarkIcon className="h-6 w-6" />
            </button>
        </div>

        {/* CONTENIDO (TABLA) */}
        <div className="overflow-auto p-0 flex-grow">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fecha / Usuario</th>
                        {isGeneral && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Producto</th>}
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Movimiento</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Cambio de Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Motivo</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {isLoading ? (
                        <tr><td colSpan="5" className="p-10 text-center text-gray-500">Cargando historial...</td></tr>
                    ) : logs.length === 0 ? (
                        <tr><td colSpan="5" className="p-10 text-center text-gray-500 italic">No hay movimientos registrados.</td></tr>
                    ) : (
                        logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                            <CalendarDaysIcon className="h-4 w-4 text-gray-400"/> {formatDate(log.created_at)}
                                        </span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <UserIcon className="h-3 w-3"/> {log.user_name} ({log.user_role})
                                        </span>
                                    </div>
                                </td>
                                
                                {isGeneral && (
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-gray-800">{log.product_name}</div>
                                        <div className="text-xs text-gray-500 font-mono">{log.product_sku}</div>
                                    </td>
                                )}

                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        {getBadge(log.type)}
                                        <span className="text-sm font-bold text-gray-700">{log.quantity} u.</span>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-100 rounded-lg py-1 px-2 w-fit mx-auto">
                                        <span className="font-mono">{log.previous_stock}</span>
                                        <ArrowLongRightIcon className="h-4 w-4 text-gray-400"/>
                                        <span className={`font-mono font-bold ${log.new_stock < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {log.new_stock}
                                        </span>
                                    </div>
                                </td>

                                <td className="px-6 py-4 text-sm text-gray-600 italic border-l-4 border-transparent hover:border-blue-200">
                                    "{log.reason}"
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        
        {/* FOOTER */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 text-right">
            <button onClick={onClose} className="px-6 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cerrar
            </button>
        </div>
      </div>
    </div>
  );
};