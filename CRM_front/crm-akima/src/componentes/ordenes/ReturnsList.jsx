import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { HasPermission } from '../HasPermission';

export const ReturnsList = ({ onCreate, onEdit }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-2">
        <h1 className="text-3xl font-bold text-gray-900">Devoluciones (RMA)</h1>
        <HasPermission required="issue.refund"> 
          <button 
            onClick={onCreate} 
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700"
          >
            <PlusIcon className="h-5 w-5" /> Registrar Devolución
          </button>
        </HasPermission>
      </div>

      <div className="bg-white shadow-xl rounded-lg overflow-hidden p-10 text-center text-gray-500 border border-dashed border-gray-300">
        <p>Aquí se cargará la lista de devoluciones.</p>
      </div>
    </div>
  );
};