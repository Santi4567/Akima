import { useState } from 'react';

import { OrderHub } from './ordenes/OrderHub';
import { OrderList } from './ordenes/OrderList';
import { OrderForm } from './ordenes/OrderForm';
import { OrderItems } from './ordenes/OrderItem';
import { ReturnsList } from './ordenes/ReturnsList';
import { ReturnsForm } from './ordenes/ReturnsForm';
import { ReturnDetails } from './ordenes/ReturnDetails';

export const Ordenes = () => {
  // Estado del HUB: 'list', 'form', 'details', 'returns', 'return-form', 'return-details'
  const [view, setView] = useState('list'); 
  
  // Estado para Órdenes
  const [selectedOrder, setSelectedOrder] = useState(null); 

  // Estado para Devoluciones (¡ESTA ES LA LÍNEA QUE TE FALTABA!)
  const [selectedReturn, setSelectedReturn] = useState(null);

  // --- LÓGICA DE NAVEGACIÓN ---

  const handleTabChange = (tab) => {
    setView(tab);
    // Limpiamos selecciones al cambiar de pestaña principal
    setSelectedOrder(null);
    setSelectedReturn(null);
  };

  const handleCreateOrder = () => {
    setSelectedOrder(null);
    setView('form');
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setView('form');
  };

  const handleCreateReturn = () => {
    setSelectedReturn(null);
    setView('return-form');
  };

  // Volver a la lista correspondiente
  const handleBack = () => {
    if (view === 'form') setView('list');
    if (view === 'details') setView('list');
    
    if (view === 'return-form') setView('returns');
    if (view === 'return-details') setView('returns');
    
    setSelectedOrder(null);
    setSelectedReturn(null);
  };

  // --- RENDERIZADO ---

  return (
    <div>
      {/* NAVEGACIÓN (Solo si no estamos en detalles profundos para no saturar) */}
      {view !== 'details' && view !== 'return-details' && (
        <OrderHub activeTab={view === 'return-form' ? 'returns' : view === 'form' ? 'list' : view} onTabChange={handleTabChange} />
      )}

      {/* 1. SECCIÓN ÓRDENES */}
      
      {/* Lista */}
      {view === 'list' && (
        <OrderList 
          onViewDetails={(order) => { setSelectedOrder(order); setView('details'); }}
          onCreateNew={handleCreateOrder}
        />
      )}

      {/* Formulario (Crear/Editar) */}
      {view === 'form' && (
        <OrderForm 
          initialData={selectedOrder} // Si quieres soportar edición
          onClose={handleBack}
          onSuccess={() => { setView('list'); }} 
        />
      )}

      {/* Detalles Completos */}
      {view === 'details' && selectedOrder && (
        <OrderItems 
          order={selectedOrder}
          onClose={handleBack}
        />
      )}


      {/* 2. SECCIÓN DEVOLUCIONES */}

      {/* Lista */}
      {view === 'returns' && (
         <ReturnsList 
            onCreate={handleCreateReturn}
            // AQUÍ USAMOS EL ESTADO QUE FALTABA
            onViewDetails={(rma) => { setSelectedReturn(rma); setView('return-details'); }}
         />
      )}
      
      {/* Formulario */}
      {view === 'return-form' && (
        <ReturnsForm onClose={handleBack} />
      )}

      {/* Detalles (Nuevo) */}
      {view === 'return-details' && selectedReturn && (
        <ReturnDetails 
            returnId={selectedReturn.id}
            onClose={handleBack}
        />
      )}

    </div>
  );
};