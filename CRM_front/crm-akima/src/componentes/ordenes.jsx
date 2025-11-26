import { useState } from 'react';

import { OrderHub } from './ordenes/OrderHub';
import { OrderList } from './ordenes/OrderList';
import { OrderForm } from './ordenes/OrderForm';
import { OrderItems } from './ordenes/OrderItem';
import { ReturnsList } from './ordenes/ReturnsList';
import { ReturnsForm } from './ordenes/ReturnsForm';

export const Ordenes = () => {
  // Estado del HUB: 'list', 'form', 'details', 'returns', 'return-form'
  const [view, setView] = useState('list'); 
  const [selectedOrder, setSelectedOrder] = useState(null); // Para ver detalles

  // Navegación del Tab
  const handleTabChange = (tab) => {
    if (tab === 'list') setView('list');
    if (tab === 'form') setView('form');
    if (tab === 'returns') setView('returns');
  };

  return (
    <div>
      {/* NAVEGACIÓN (Solo si no estamos viendo detalles profundos para no saturar) */}
      {view !== 'details' && (
        <OrderHub activeTab={view} onTabChange={handleTabChange} />
      )}

      {/* VISTA: LISTA DE ÓRDENES */}
      {view === 'list' && (
        <OrderList 
          onViewDetails={(order) => { setSelectedOrder(order); setView('details'); }}
          onCreateNew={() => setView('form')}
        />
      )}

      {/* VISTA: CREAR ORDEN */}
      {view === 'form' && (
        <OrderForm 
          onSuccess={() => setView('list')} 
        />
      )}

      {/* VISTA: DETALLES DE ORDEN */}
      {view === 'details' && selectedOrder && (
        <OrderItems 
          order={selectedOrder}
          onClose={() => { setSelectedOrder(null); setView('list'); }}
        />
      )}

      {/* VISTA: DEVOLUCIONES (Placeholder) */}
      {view === 'returns' && (
         <ReturnsList 
            onCreate={() => setView('return-form')}
            
            // --- AGREGA ESTA LÍNEA QUE FALTA ---
            onViewDetails={(rma) => { setSelectedReturn(rma); setView('return-details'); }}
         />
      )}
      
      {view === 'return-form' && (
        <ReturnsForm onClose={() => setView('returns')} />
      )}

    </div>
  );
};