import { ClipboardDocumentCheckIcon, PlusCircleIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/solid';

export const OrderHub = ({ activeTab, onTabChange }) => {
  
  const getTabClass = (tabName) => {
    const isActive = activeTab === tabName;
    return `whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200 ${
      isActive
        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm'
        : 'text-slate-600 bg-transparent hover:text-emerald-700 hover:bg-emerald-50 border border-transparent'
    }`;
  };

  return (
    <div className="mb-8">
      {/* Contenedor con fondo blanco puro y borde definido para que resalte sobre el fondo general */}
      <nav className="inline-flex p-1.5 space-x-2 bg-white border border-slate-300 rounded-xl overflow-x-auto shadow-sm" aria-label="Tabs">
        
        <button onClick={() => onTabChange('list')} className={getTabClass('list')}>
          <ClipboardDocumentCheckIcon className="h-5 w-5" />
          Lista de Órdenes
        </button>

        <button onClick={() => onTabChange('form')} className={getTabClass('form')}>
          <PlusCircleIcon className="h-5 w-5" />
          Levantar Pedido
        </button>

        <button onClick={() => onTabChange('returns')} className={getTabClass('returns')}>
          <ArrowUturnLeftIcon className="h-5 w-5" />
          Devoluciones
        </button>

      </nav>
    </div>
  );
};