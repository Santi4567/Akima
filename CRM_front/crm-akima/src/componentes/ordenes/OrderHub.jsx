import { ClipboardDocumentCheckIcon, PlusCircleIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/solid';

export const OrderHub = ({ activeTab, onTabChange }) => {
  
  const getTabClass = (tabName) => {
    const isActive = activeTab === tabName;
    return `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
      isActive
        ? 'border-green-500 text-green-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;
  };

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        
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