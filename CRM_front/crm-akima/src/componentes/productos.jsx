// src/componentes/Productos.jsx

import { useState, useEffect } from 'react'; // <-- AGREGADO: useEffect
import { useLocation } from 'react-router-dom'; // <-- AGREGADO: useLocation, QUITADO: Link (ya no se usa aquí)

// Importamos los componentes hijos
import { ProductList } from './productos/ProductList';
import { ProductForm } from './productos/ProductForm';
import { ProductImages } from './productos/ProductImages';
import { ProductHubNav } from './productos/ProductHubNav';

export const Productos = () => {
  // Hook para leer el estado que viene del Link (desde Categorías)
  const location = useLocation();
  
  // Estado del HUB
  const [view, setView] = useState('list'); // 'list', 'form', 'images'
  const [editingProduct, setEditingProduct] = useState(null);
  const [imagesProduct, setImagesProduct] = useState(null);
  
  // Notificación global para pasar entre vistas
  const [hubNotification, setHubNotification] = useState(null);
   
  // --- EFECTO PARA DETECTAR NAVEGACIÓN EXTERNA ---
  useEffect(() => {
    // Si viene un estado en la navegación diciendo "initialTab: images"
    if (location.state?.initialTab === 'images') {
      setView('images');
      
      // Limpiamos el estado para que si recarga no se quede "pegado" forzando la vista
      window.history.replaceState({}, document.title); 
    }
  }, [location]);

  // --- Handlers de Navegación ---
   
  const handleCreate = () => {
    setEditingProduct(null);
    setView('form');
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setView('form');
  };

  const handleManageImages = (product) => {
    setImagesProduct(product);
    setView('images');
  };

  const handleBackToList = (notificationMsg = null) => {
    setView('list');
    setEditingProduct(null);
    setImagesProduct(null);
    if (notificationMsg) {
      setHubNotification(notificationMsg);
    }
  };

  // --- RENDERIZADO ---

  // Si estamos en Formulario
  if (view === 'form') {
    return (
      <ProductForm
        initialData={editingProduct}
        onClose={() => handleBackToList()}
        onSuccess={() => handleBackToList({ type: 'success', message: 'Producto guardado exitosamente.' })}
        onError={(msg) => alert(msg)} // O manejar error localmente con un estado
      />
    );
  }

  // Si estamos en Imágenes
  if (view === 'images') {
    return (
      <ProductImages 
        initialProduct={imagesProduct}
        onClose={() => handleBackToList()}
      />
    );
  }

  // Si estamos en Lista (Default)
  return (
    <div>
      {/* MENU TABS (HUB) */}
      {/* Quitamos el div wrapper con borde porque ProductHubNav ya lo tiene */}
      <ProductHubNav 
        activeTab={view}       // Pasamos la vista actual ('list' o 'images')
        onTabChange={setView}  // Pasamos la función para cambiarla
      />

      {/* Renderizamos la Lista */}
      <ProductList 
        onCreate={handleCreate}
        onEdit={handleEdit}
        onManageImages={handleManageImages}
        externalNotification={hubNotification}
      />
    </div>
  );
};