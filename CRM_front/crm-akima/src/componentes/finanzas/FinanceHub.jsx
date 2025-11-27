import { ChartBarIcon, BanknotesIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';

export const FinanceHub = ({ activeTab, onTabChange }) => {
  
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
        
        <button onClick={() => onTabChange('dashboard')} className={getTabClass('dashboard')}>
          <ChartBarIcon className="h-5 w-5" />
          Dashboard & KPIs
        </button>

        <button onClick={() => onTabChange('income')} className={getTabClass('income')}>
          <BanknotesIcon className="h-5 w-5" />
          Ingresos (Cobranza)
        </button>

        <button onClick={() => onTabChange('expenses')} className={getTabClass('expenses')}>
          <ArrowTrendingDownIcon className="h-5 w-5" />
          Egresos (Reembolsos)
        </button>

      </nav>
    </div>
  );
};