import { Link } from 'react-router-dom';
// Opcional: puedes usar un icono de 'heroicons'
import { ShieldExclamationIcon } from '@heroicons/react/24/outline'; 

export const Unauthorized = () => {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <ShieldExclamationIcon className="mx-auto h-16 w-auto text-red-500" />
          <h2 className="mt-6 text-center text-4xl font-bold tracking-tight text-gray-900">
            Acceso Denegado
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Lo sentimos, tu rol no tiene los permisos necesarios para acceder a esta sección.
          </p>
        </div>
        
        <div className="mt-8">
          <Link
            to="/home"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
};