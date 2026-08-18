import { useState, useEffect } from 'react';
import { ShoppingCartIcon, TrashIcon, PlusIcon, PencilSquareIcon } from '@heroicons/react/24/solid';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const OrderForm = ({ onSuccess, initialData }) => {
  const [clientId, setClientId] = useState(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState([]); 

  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [showClientList, setShowClientList] = useState(false);
  const [showProductList, setShowProductList] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '', list: [] });

  useEffect(() => {
    if (initialData) {
        // Lógica para cargar datos si se implementa edición
    }
  }, [initialData]);

  useEffect(() => {
    if(clientSearch.length > 1) {
      const fetchClients = async () => {
        try {
            const res = await fetch(`${API_URL}/api/clients/search?q=${clientSearch}`, { credentials: 'include' });
            const data = await res.json();
            if(data.success) setClients(data.data);
        } catch (e) { console.error(e); }
      };
      const timer = setTimeout(fetchClients, 300);
      return () => clearTimeout(timer);
    }
  }, [clientSearch]);

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

  const handleSelectClient = (client) => {
    setClientId(client.id);
    setClientSearch(`${client.first_name} ${client.last_name}`);
    if (client.address) {
        setAddress(client.address);
    } else {
        setAddress(''); 
    }
    setShowClientList(false);
  };

  const addToCart = (product) => {
    const exists = cart.find(item => item.product_id === product.id);
    if (exists) {
      setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product_id: product.id, name: product.name, price: product.price, quantity: 1, sku: product.sku }]);
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
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl shadow-sm mb-4">
            <p className="font-bold text-amber-800">Advertencias de Inventario:</p>
            <ul className="list-disc ml-5 text-amber-700 text-sm mt-1">
                {notification.list.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
        </div>
      )}

      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Levantar Nuevo Pedido</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-2">
        
        {/* === COLUMNA IZQUIERDA: DATOS DEL CLIENTE === */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 shadow-sm rounded-2xl border border-slate-200">
            <h3 className="text-lg font-extrabold text-slate-800 mb-5 border-b border-slate-100 pb-3">Información del Cliente</h3>
            
            {/* Buscador de Cliente */}
            <div className="relative mb-5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Buscar Cliente *</label>
                <input 
                    type="text" 
                    placeholder="Escribe nombre o email..." 
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm font-medium"
                    value={clientSearch}
                    onChange={e => { setClientSearch(e.target.value); setShowClientList(true); }}
                    onBlur={() => setTimeout(() => setShowClientList(false), 200)}
                />
                {showClientList && clients.length > 0 && (
                    <ul className="absolute z-20 w-full bg-white border border-slate-200 mt-1 max-h-60 overflow-y-auto shadow-xl rounded-xl">
                    {clients.map(c => (
                        <li key={c.id} onClick={() => handleSelectClient(c)} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors">
                            <p className="font-bold text-slate-800 text-sm">{c.first_name} {c.last_name}</p>
                            <p className="text-xs text-slate-500 font-medium">{c.email}</p>
                        </li>
                    ))}
                    </ul>
                )}
            </div>

            {/* Dirección de Envío */}
            <div className="mb-5">
                <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección de Envío</label>
                    <button 
                        type="button"
                        onClick={() => document.getElementById('address-input').focus()}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                    >
                        <PencilSquareIcon className="h-3.5 w-3.5"/> Editar
                    </button>
                </div>
                <textarea 
                    id="address-input"
                    className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm" 
                    rows="3"
                    placeholder="Calle, Número, Colonia, Ciudad..."
                    value={address} 
                    onChange={e => setAddress(e.target.value)}
                ></textarea>
            </div>

            {/* Notas */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notas del Pedido</label>
                <textarea 
                    className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm" 
                    rows="2"
                    placeholder="Instrucciones especiales para el envío o entrega..."
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                ></textarea>
            </div>
          </div>
        </div>

        {/* === COLUMNA DERECHA: CARRITO DE COMPRAS === */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 shadow-sm rounded-2xl border border-slate-200 min-h-[500px] flex flex-col">
            
            {/* Header del Carrito */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 pb-4">
               <h3 className="text-lg font-extrabold flex items-center gap-2 text-slate-800">
                 <ShoppingCartIcon className="h-6 w-6 text-emerald-500"/> Carrito de Productos
               </h3>
               
               {/* Buscador Productos */}
               <div className="relative w-full sm:w-80">
                  <input 
                    type="text" placeholder="🔍 Buscar por nombre o SKU..." 
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm font-medium"
                    value={productSearch}
                    onChange={e => { setProductSearch(e.target.value); setShowProductList(true); }}
                    onBlur={() => setTimeout(() => setShowProductList(false), 200)}
                  />
                  {showProductList && products.length > 0 && (
                    <ul className="absolute z-20 w-full bg-white border border-slate-200 mt-2 max-h-60 overflow-y-auto shadow-2xl rounded-xl right-0">
                      {products.map(p => (
                        <li key={p.id} onClick={() => addToCart(p)} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center transition-colors">
                          <div>
                              <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                              <p className="text-xs text-slate-400 font-mono font-bold mt-0.5">{p.sku}</p>
                          </div>
                          <span className="font-extrabold text-emerald-600">${p.price}</span>
                        </li>
                      ))}
                    </ul>
                  )}
               </div>
            </div>

            {/* Tabla Carrito */}
            <div className="flex-grow overflow-auto">
                <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                    <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Producto</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Cant.</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Precio U.</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Subtotal</th>
                    <th className="px-4 py-3"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {cart.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-4">
                            <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                        <input 
                            type="number" min="1" 
                            className="w-16 p-1.5 border border-slate-300 rounded-lg text-center font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                            value={item.quantity}
                            onChange={e => updateQuantity(index, e.target.value)}
                        />
                        </td>
                        <td className="px-4 py-4 text-sm text-right font-semibold text-slate-600">${item.price}</td>
                        <td className="px-4 py-4 text-sm font-extrabold text-slate-900 text-right">${(item.price * item.quantity).toFixed(2)}</td>
                        <td className="px-4 py-4 text-right">
                        <button onClick={() => removeFromCart(index)} className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100">
                            <TrashIcon className="h-5 w-5"/>
                        </button>
                        </td>
                    </tr>
                    ))}
                    {cart.length === 0 && (
                        <tr>
                            <td colSpan="5" className="p-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                                <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <ShoppingCartIcon className="h-8 w-8 text-slate-300"/>
                                </div>
                                <p className="font-medium">El carrito está vacío. Busca productos arriba para comenzar.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>
            
            {/* Footer Totales */}
            <div className="mt-6 border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 p-4 rounded-xl">
               <div className="text-right sm:text-left">
                   <p className="text-sm font-bold text-slate-500">Items en carrito: {cart.reduce((a, c) => a + c.quantity, 0)}</p>
               </div>
               <div className="flex items-center gap-6">
                   <div className="text-right">
                       <p className="text-xs text-slate-500 uppercase font-extrabold tracking-widest">Total a Pagar</p>
                       <p className="text-3xl font-black text-slate-900">${total.toFixed(2)}</p>
                   </div>
                   <button 
                     onClick={handleSubmit}
                     disabled={isSubmitting || cart.length === 0 || !clientId}
                     className="bg-emerald-600 text-white px-8 py-3 rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-500 hover:-translate-y-0.5 disabled:translate-y-0 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all flex items-center gap-2 font-bold text-lg"
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