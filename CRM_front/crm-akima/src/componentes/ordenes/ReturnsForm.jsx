import { ArrowLeftIcon } from '@heroicons/react/24/solid';

export const ReturnsForm = ({ onClose }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Registrar Devolución</h1>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center text-gray-500">
        <p>Aquí irá el formulario para procesar devoluciones y reembolsos.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-md">Cancelar</button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-md">Procesar Devolución</button>
        </div>
      </div>
    </div>
  );
};