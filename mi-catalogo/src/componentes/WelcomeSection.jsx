import { UserGroupIcon, SparklesIcon } from '@heroicons/react/24/outline';

export const WelcomeSection = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-8 md:p-12 text-center border border-gray-100">
      <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-6">
        <SparklesIcon className="h-8 w-8 text-green-600" />
      </div>
      
      <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
        Creciendo Juntos en el Campo
      </h2>
      
      <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
        Somos <span className="font-bold text-green-700">Akima CRM</span>, un grupo especializado en la venta y distribución de fertilizantes de alto rendimiento. 
        Nuestra misión es potenciar tus cultivos con soluciones innovadoras y sostenibles, garantizando la mejor calidad para el agricultor moderno.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-2">🌱 Calidad Garantizada</h4>
            <p className="text-sm text-gray-500">Productos certificados para el máximo rendimiento de tu cosecha.</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-2">🚚 Distribución Eficiente</h4>
            <p className="text-sm text-gray-500">Logística optimizada para que recibas tu pedido a tiempo.</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-2">🤝 Soporte Experto</h4>
            <p className="text-sm text-gray-500">Asesoramiento técnico personalizado para cada tipo de cultivo.</p>
        </div>
      </div>
    </div>
  );
};