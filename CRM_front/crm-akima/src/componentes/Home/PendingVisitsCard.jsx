import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export const PendingVisitsCard = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { hasAnyPermission } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Si no tiene permisos de ver visitas, no cargamos nada
    if (!hasAnyPermission(['view.all.visits', 'view.own.visits'])) {
        setLoading(false);
        return;
    }

    const fetchVisits = async () => {
      try {
        const res = await fetch(`${API_URL}/api/visits`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          // Filtramos en el cliente las pendientes
          const pending = data.data.filter(v => v.status === 'pending');
          setPendingCount(pending.length);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, [hasAnyPermission]);

  if (!hasAnyPermission(['view.all.visits', 'view.own.visits'])) return null;

  return (
    <div 
        onClick={() => navigate('/visitas')}
        className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500 cursor-pointer hover:shadow-lg transition-shadow group"
    >
      <div className="flex justify-between items-start">
        <div>
            <p className="text-gray-500 font-bold uppercase text-xs mb-1">Agenda</p>
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Visitas Pendientes</h3>
        </div>
        <div className="bg-yellow-100 p-3 rounded-full">
            <CalendarDaysIcon className="h-6 w-6 text-yellow-600" />
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-2">
        {loading ? (
            <span className="text-gray-400 text-sm">Cargando...</span>
        ) : (
            <>
                <span className="text-3xl font-bold text-gray-900">{pendingCount}</span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                    <ClockIcon className="h-4 w-4"/> por realizar
                </span>
            </>
        )}
      </div>
    </div>
  );
};
