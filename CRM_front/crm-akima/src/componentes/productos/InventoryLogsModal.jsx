import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ArrowLongRightIcon, 
  UserIcon, 
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const InventoryLogsModal = ({ productId, productName, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const isGeneral = !productId;
  const title = isGeneral ? 'Kardex General' : `Kardex: ${productName}`;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
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

  const formatDate = (date) => new Date(date).toLocaleString('es-MX', { 
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' 
  });
  
  const getBadgeStyle = (type) => {
    switch (type) {
      case 'add': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'subtract': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'set': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getMoveTypeName = (type) => {
    // Si type es null o undefined, regresamos un valor por defecto para que no se rompa
    if (!type) return 'DESCONOCIDO'; 
    
    switch (type) {
      case 'add': return 'INGRESO';
      case 'subtract': return 'SALIDA';
      case 'set': return 'AJUSTE';
      default: return String(type).toUpperCase(); // Aseguramos que sea string antes de usar toUpperCase
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      
      {/* Fondo con desenfoque suave */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Contenedor Principal Glassmorphism */}
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-fadeIn">
        
        {/* CABECERA */}
        <div className="px-8 py-6 border-b border-slate-200 bg-white/50 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl border border-blue-200 shadow-sm">
                    <ClipboardDocumentListIcon className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
                    <p className="text-sm font-bold text-slate-500 mt-0.5">Registro histórico de movimientos y auditoría</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-sm">
                <XMarkIcon className="h-6 w-6" />
            </button>
        </div>

        {/* CONTENIDO DE TABLA */}
        <div className="flex-grow overflow-y-auto bg-slate-50/30 p-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="min-w-full text-left border-collapse">
                    <thead className="bg-slate-100/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Fecha y Usuario</th>
                            {isGeneral && <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Producto</th>}
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Movimiento</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Cambio de Stock</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Motivo Registrado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={isGeneral ? 5 : 4} className="py-12 text-center text-slate-400">
                                    <div className="animate-pulse font-bold flex flex-col items-center justify-center">
                                        <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-500 mb-3" />
                                        Cargando historial...
                                    </div>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={isGeneral ? 5 : 4} className="py-12 text-center text-slate-400 font-bold text-lg">
                                    No hay movimientos registrados.
                                </td>
                            </tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm font-bold text-slate-800 mb-1">
                                            <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-slate-400" />
                                            {formatDate(log.created_at)}
                                        </div>
                                        <div className="flex items-center text-xs font-semibold text-slate-500">
                                            <UserIcon className="h-3.5 w-3.5 mr-1.5" />
                                            Por: {log.user_name}
                                        </div>
                                    </td>

                                    {isGeneral && (
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-extrabold text-slate-800">{log.product_name}</div>
                                            <div className="text-xs font-bold text-slate-500 font-mono mt-0.5">{log.sku}</div>
                                        </td>
                                    )}

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border ${getBadgeStyle(log.move_type)}`}>
                                            {getMoveTypeName(log.move_type)}
                                        </span>
                                        {log.quantity !== 0 && log.move_type !== 'set' && (
                                            <span className="ml-2 font-bold text-sm text-slate-700">
                                                {log.quantity} un.
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3 bg-slate-100 border border-slate-200 rounded-xl py-1.5 px-3 w-fit mx-auto shadow-inner">
                                            <span className="font-mono text-sm font-bold text-slate-500">{log.previous_stock}</span>
                                            <ArrowLongRightIcon className="h-4 w-4 text-slate-400"/>
                                            <span className={`font-mono text-sm font-black ${
                                                log.new_stock > log.previous_stock ? 'text-emerald-600' : 
                                                log.new_stock < log.previous_stock ? 'text-rose-600' : 
                                                'text-blue-600'
                                            }`}>
                                                {log.new_stock}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-sm font-medium text-slate-600 italic">
                                        "{log.reason}"
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
        
        {/* FOOTER */}
        <div className="bg-white/80 p-5 border-t border-slate-200 text-right">
            <button onClick={onClose} className="px-8 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all">
                Cerrar Historial
            </button>
        </div>
      </div>
    </div>
  );
};