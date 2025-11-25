import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Importamos los componentes hijos
import { ProductList } from './productos/ProductList';
import { ProductForm } from './productos/ProductForm';
import { ProductImages } from './productos/ProductImages';
import { ProductHubNav } from './productos/ProductHubNav';
import { ProductInventory } from './productos/ProductInventory'; // <--- IMPORTAR EL NUEVO COMPONENTE

export const Productos = () => {
  const location = useLocation();
  
  // Estado del HUB: ahora puede ser 'inventory' también
  const [view, setView] = useState('list'); 
  const [editingProduct, setEditingProduct] = useState(null);
  const [imagesProduct, setImagesProduct] = useState(null);
  const [hubNotification, setHubNotification] = useState(null);
   
  useEffect(() => {
    if (location.state?.initialTab) {
      setView(location.state.initialTab);
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

  if (view === 'form') {
    return (
      <ProductForm
        initialData={editingProduct}
        onClose={() => handleBackToList()}
        onSuccess={() => handleBackToList({ type: 'success', message: 'Producto guardado exitosamente.' })}
        onError={(msg) => alert(msg)} 
      />
    );
  }

  if (view === 'images') {
    return (
      <ProductImages 
        initialProduct={imagesProduct}
        onClose={() => handleBackToList()}
      />
    );
  }

  // Nueva lógica de renderizado para las pestañas principales
  return (
    <div>
      {/* MENU TABS (HUB) */}
      <ProductHubNav 
        activeTab={view}       
        onTabChange={setView}  
      />

      {/* Vista: Lista de Productos (Datos Generales) */}
      {view === 'list' && (
        <ProductList 
          onCreate={handleCreate}
          onEdit={handleEdit}
          onManageImages={handleManageImages}
          externalNotification={hubNotification}
        />
      )}

      {/* Vista: Inventario (Stock Rápido) */}
      {view === 'inventory' && (
        <ProductInventory />
      )}
    </div>
  );
};