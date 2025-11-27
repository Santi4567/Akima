import { useState, useEffect } from 'react';
import { ShoppingCartIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL;

export const OrderForm = ({ onSuccess }) => {
  // Datos del Pedido
  const [clientId, setClientId] = useState(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState([]); // [{ product_id, name, quantity, price }]

  // Buscadores
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [showClientList, setShowClientList] = useState(false);
  const [showProductList, setShowProductList] = useState(false);

  // UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '', list: [] });

  // Cargar Clientes (Buscador)
  useEffect(() => {
    if(clientSearch.length > 1) {
      fetch(`${API_URL}/api/clients/search?q=${clientSearch}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => { if(data.success) setClients(data.data); });
    }
  }, [clientSearch]);

  // Cargar Productos (Buscador)
  useEffect(() => {
    if(productSearch.length > 1) {
      fetch(`${API_URL}/api/products/search?q=${productSearch}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => { if(data.success) setProducts(data.data); });
    }
  }, [productSearch]);

  // Agregar al Carrito
  const addToCart = (product) => {
    const exists = cart.find(item => item.product_id === product.id);
    if (exists) {
      setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }]);
    }
    setProductSearch('');
    setShowProductList(false);
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const updateQuantity = (index, val) => {
    const newCart = [...cart];
    newCart[index].quantity = parseInt(val) || 1;
    setCart(newCart);
  };

  const handleSubmit = async () => {
    if (!clientId || cart.length === 0) {
      setNotification({ type: 'error', message: 'Selecciona un cliente y agrega productos.' });
      return;
    }
    setIsSubmitting(true);
    setNotification({ type: '', message: '' });

    const payload = {
      client_id: clientId,
      shipping_address: address,
      notes: notes,
      items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
    };

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        // Si hay warnings (stock bajo), los mostramos pero es éxito
        if (data.warnings && data.warnings.length > 0) {
            setNotification({ 
                type: 'warning', 
                message: 'Pedido creado con advertencias de inventario:',
                list: data.warnings 
            });
        } else {
            setNotification({ type: 'success', message: data.message });
        }
        // Limpiar form
        setCart([]);
        setClientId(null);
        setClientSearch('');
        setAddress('');
        setNotes('');
        setTimeout(() => onSuccess(), 3000); // Regresar a la lista tras 3s
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Error de red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />
      
      {/* Mostrar lista de warnings si existen */}
      {notification.list && notification.list.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="font-bold text-yellow-700">Advertencias:</p>
            <ul className="list-disc ml-5 text-yellow-700">
                {notification.list.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-800">Levantar Nuevo Pedido</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA IZQ: Datos Cliente */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 shadow rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                className="w-full p-2 border rounded"
                value={clientSearch}
                onChange={e => { setClientSearch(e.target.value); setShowClientList(true); }}
                onBlur={() => setTimeout(() => setShowClientList(false), 200)}
              />
              {showClientList && clients.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {clients.map(c => (
                    <li key={c.id} onClick={() => { setClientId(c.id); setClientSearch(`${c.first_name} ${c.last_name}`); }} className="p-2 hover:bg-gray-100 cursor-pointer">
                      {c.first_name} {c.last_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Dirección de Envío</label>
            <textarea 
              className="w-full p-2 border rounded" rows="3"
              value={address} onChange={e => setAddress(e.target.value)}
            ></textarea>

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Notas</label>
            <textarea 
              className="w-full p-2 border rounded" rows="2"
              value={notes} onChange={e => setNotes(e.target.value)}
            ></textarea>
          </div>
        </div>

        {/* COLUMNA DER: Carrito */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 shadow rounded-lg min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold flex items-center gap-2">
                 <ShoppingCartIcon className="h-5 w-5 text-blue-600"/> Productos
               </h3>
               {/* Buscador Productos */}
               <div className="relative w-64">
                  <input 
                    type="text" placeholder="Agregar producto..." 
                    className="w-full p-1 border rounded text-sm"
                    value={productSearch}
                    onChange={e => { setProductSearch(e.target.value); setShowProductList(true); }}
                    onBlur={() => setTimeout(() => setShowProductList(false), 200)}
                  />
                  {showProductList && products.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto shadow-lg right-0">
                      {products.map(p => (
                        <li key={p.id} onClick={() => addToCart(p)} className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between">
                          <span>{p.name}</span>
                          <span className="text-gray-500">${p.price}</span>
                        </li>
                      ))}
                    </ul>
                  )}
               </div>
            </div>

            {/* Tabla Carrito */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cant.</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2 text-sm">{item.name}</td>
                    <td className="px-4 py-2">
                      <input 
                        type="number" min="1" 
                        className="w-16 p-1 border rounded text-center"
                        value={item.quantity}
                        onChange={e => updateQuantity(index, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2 text-sm">${item.price}</td>
                    <td className="px-4 py-2 text-sm font-bold">${(item.price * item.quantity).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => removeFromCart(index)} className="text-red-500 hover:text-red-700">
                        <TrashIcon className="h-4 w-4"/>
                      </button>
                    </td>
                  </tr>
                ))}
                {cart.length === 0 && <tr><td colSpan="5" className="p-4 text-center text-gray-500">Carrito vacío</td></tr>}
              </tbody>
            </table>
            
            <div className="mt-6 flex justify-between items-center border-t pt-4">
               <div className="text-xl font-bold">Total: ${total.toFixed(2)}</div>
               <button 
                 onClick={handleSubmit}
                 disabled={isSubmitting}
                 className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 disabled:bg-gray-300"
               >
                 {isSubmitting ? 'Procesando...' : 'Finalizar Pedido'}
               </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};