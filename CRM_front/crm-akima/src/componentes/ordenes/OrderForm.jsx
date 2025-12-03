import { useState, useEffect } from 'react';
import { ShoppingCartIcon, TrashIcon, PlusIcon, PencilSquareIcon } from '@heroicons/react/24/solid';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const OrderForm = ({ onSuccess, initialData }) => {
  // Datos del Pedido
  const [clientId, setClientId] = useState(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState([]); 

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

  // Si vienes de editar (aunque por ahora es solo crear)
  useEffect(() => {
    if (initialData) {
        // Lógica para cargar datos si se implementa edición
    }
  }, [initialData]);

  // Cargar Clientes (Buscador)
  useEffect(() => {
    if(clientSearch.length > 1) {
      const fetchClients = async () => {
        try {
            const res = await fetch(`${API_URL}/api/clients/search?q=${clientSearch}`, { credentials: 'include' });
            const data = await res.json();
            if(data.success) setClients(data.data);
        } catch (e) { console.error(e); }
      };
      // Pequeño debounce manual
      const timer = setTimeout(fetchClients, 300);
      return () => clearTimeout(timer);
    }
  }, [clientSearch]);

  // Cargar Productos (Buscador)
  useEffect(() => {
    if(productSearch.length > 1) {
        const fetchProducts = async () => {
            try {
                const res = await fetch(`${API_URL}/api/products/search?q=${productSearch}`, { credentials: 'include' });
                const data = await res.json();
                if(data.success) setProducts(data.data);
            } catch (e) { console.error(e); }
        };
        const timer = setTimeout(fetchProducts, 300);
        return () => clearTimeout(timer);
    }
  }, [productSearch]);

  // SELECCIONAR CLIENTE (Aquí está el cambio principal)
  const handleSelectClient = (client) => {
    setClientId(client.id);
    setClientSearch(`${client.first_name} ${client.last_name}`);
    
    // --- AUTOLENADO DE DIRECCIÓN ---
    // Verificamos si el cliente tiene dirección guardada
    if (client.address) {
        setAddress(client.address);
    } else {
        setAddress(''); // Opcional: dejar vacío o mantener lo que estaba
    }
    
    setShowClientList(false);
  };

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
        if (data.warnings && data.warnings.length > 0) {
            setNotification({ 
                type: 'warning', 
                message: 'Pedido creado con advertencias:',
                list: data.warnings 
            });
        } else {
            setNotification({ type: 'success', message: data.message });
        }
        
        // Reset
        setCart([]);
        setClientId(null);
        setClientSearch('');
        setAddress('');
        setNotes('');
        setTimeout(() => onSuccess(), 3000); 
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
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />
      
      {notification.list && notification.list.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="font-bold text-yellow-700">Advertencias de Inventario:</p>
            <ul className="list-disc ml-5 text-yellow-700 text-sm">
                {notification.list.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
        </div>
      )}

      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Levantar Nuevo Pedido</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === COLUMNA IZQUIERDA: DATOS DEL CLIENTE === */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 shadow-md rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Información del Cliente</h3>
            
            {/* Buscador de Cliente */}
            <div className="relative mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Buscar Cliente *</label>
                <input 
                    type="text" 
                    placeholder="Escribe nombre..." 
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={clientSearch}
                    onChange={e => { setClientSearch(e.target.value); setShowClientList(true); }}
                    onBlur={() => setTimeout(() => setShowClientList(false), 200)}
                />
                {showClientList && clients.length > 0 && (
                    <ul className="absolute z-20 w-full bg-white border mt-1 max-h-60 overflow-y-auto shadow-xl rounded-md">
                    {clients.map(c => (
                        <li key={c.id} onClick={() => handleSelectClient(c)} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0">
                            <p className="font-bold text-gray-800">{c.first_name} {c.last_name}</p>
                            <p className="text-xs text-gray-500">{c.email}</p>
                        </li>
                    ))}
                    </ul>
                )}
            </div>

            {/* Dirección de Envío */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-gray-700">Dirección de Envío</label>
                    <button 
                        type="button"
                        onClick={() => document.getElementById('address-input').focus()}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                        <PencilSquareIcon className="h-3 w-3"/> Editar
                    </button>
                </div>
                <textarea 
                    id="address-input"
                    className="w-full p-2 border border-gray-300 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors" 
                    rows="3"
                    placeholder="Calle, Número, Colonia, Ciudad..."
                    value={address} 
                    onChange={e => setAddress(e.target.value)}
                ></textarea>
            </div>

            {/* Notas */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Notas del Pedido</label>
                <textarea 
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" 
                    rows="2"
                    placeholder="Instrucciones especiales..."
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                ></textarea>
            </div>
          </div>
        </div>

        {/* === COLUMNA DERECHA: CARRITO DE COMPRAS === */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 shadow-md rounded-lg border border-gray-200 min-h-[500px] flex flex-col">
            
            {/* Header del Carrito */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-4">
               <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
                 <ShoppingCartIcon className="h-6 w-6 text-blue-600"/> Carrito de Productos
               </h3>
               
               {/* Buscador Productos */}
               <div className="relative w-full sm:w-72">
                  <input 
                    type="text" placeholder="🔍 Agregar producto (Nombre o SKU)..." 
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={productSearch}
                    onChange={e => { setProductSearch(e.target.value); setShowProductList(true); }}
                    onBlur={() => setTimeout(() => setShowProductList(false), 200)}
                  />
                  {showProductList && products.length > 0 && (
                    <ul className="absolute z-20 w-full bg-white border mt-1 max-h-60 overflow-y-auto shadow-xl rounded-md right-0">
                      {products.map(p => (
                        <li key={p.id} onClick={() => addToCart(p)} className="p-3 hover:bg-green-50 cursor-pointer border-b last:border-0 flex justify-between items-center">
                          <div>
                              <p className="font-bold text-gray-800">{p.name}</p>
                              <p className="text-xs text-gray-500">SKU: {p.sku}</p>
                          </div>
                          <span className="font-bold text-green-700">${p.price}</span>
                        </li>
                      ))}
                    </ul>
                  )}
               </div>
            </div>

            {/* Tabla Carrito */}
            <div className="flex-grow overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Producto</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Cant.</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Precio U.</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Subtotal</th>
                    <th className="px-4 py-3"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {cart.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-center">
                        <input 
                            type="number" min="1" 
                            className="w-16 p-1 border border-gray-300 rounded text-center focus:ring-blue-500 focus:border-blue-500"
                            value={item.quantity}
                            onChange={e => updateQuantity(index, e.target.value)}
                        />
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">${item.price}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">${(item.price * item.quantity).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                        <button onClick={() => removeFromCart(index)} className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors">
                            <TrashIcon className="h-5 w-5"/>
                        </button>
                        </td>
                    </tr>
                    ))}
                    {cart.length === 0 && (
                        <tr>
                            <td colSpan="5" className="p-10 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                                <ShoppingCartIcon className="h-12 w-12 mx-auto mb-2 text-gray-300"/>
                                El carrito está vacío. Busca productos arriba para comenzar.
                            </td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>
            
            {/* Footer Totales */}
            <div className="mt-6 border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
               <div className="text-right sm:text-left">
                   <p className="text-sm text-gray-500">Items: {cart.reduce((a, c) => a + c.quantity, 0)}</p>
               </div>
               <div className="flex items-center gap-6">
                   <div className="text-right">
                       <p className="text-sm text-gray-500 uppercase font-bold">Total a Pagar</p>
                       <p className="text-3xl font-bold text-gray-900">${total.toFixed(2)}</p>
                   </div>
                   <button 
                     onClick={handleSubmit}
                     disabled={isSubmitting || cart.length === 0 || !clientId}
                     className="bg-green-600 text-white px-8 py-3 rounded-lg shadow-lg hover:bg-green-700 disabled:bg-gray-300 disabled:shadow-none transition-all flex items-center gap-2 font-bold text-lg"
                   >
                     {isSubmitting ? 'Procesando...' : 'Finalizar Pedido'}
                   </button>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};