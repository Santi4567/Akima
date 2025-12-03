import { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const PRODUCTS_ENDPOINT = `${API_URL}/api/products`;
const CATEGORIES_ENDPOINT = `${API_URL}/api/categories`;
const SUPPLIERS_ENDPOINT = `${API_URL}/api/suppliers`;

export const ProductForm = ({ initialData, onClose, onSuccess, onError }) => {
  // --- Estados del Formulario ---
  const [formData, setFormData] = useState({
    name: '', 
    sku: '', 
    barcode: '', 
    description: '',
    location: '', // <--- NUEVO CAMPO AGREGADO AL ESTADO
    price: '', 
    cost_price: '', 
    product_type: 'product', 
    status: 'active',
    category_id: '', 
    supplier_id: '',
    weight: '', 
    height: '', 
    width: '', 
    depth: ''
  });

  const [customFields, setCustomFields] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [existingAttributes, setExistingAttributes] = useState([]); 

  const [catSearch, setCatSearch] = useState('');
  const [supSearch, setSupSearch] = useState('');
  const [showCatDrop, setShowCatDrop] = useState(false);
  const [showSupDrop, setShowSupDrop] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAttributeIndex, setActiveAttributeIndex] = useState(null); 

  const isEditing = !!initialData;

  // --- Carga de Datos Auxiliares ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, supRes, prodRes] = await Promise.all([
            fetch(CATEGORIES_ENDPOINT, { credentials: 'include' }),
            fetch(SUPPLIERS_ENDPOINT, { credentials: 'include' }),
            fetch(PRODUCTS_ENDPOINT, { credentials: 'include' })
        ]);

        const catData = await catRes.json();
        if (catData.success) setCategories(catData.data);

        const supData = await supRes.json();
        if (supData.success) setSuppliers(supData.data);

        const prodData = await prodRes.json();
        if (prodData.success) {
          const allAttrs = new Set();
          prodData.data.forEach(p => {
            if (p.attributes_list && Array.isArray(p.attributes_list)) {
              p.attributes_list.forEach(attr => allAttrs.add(attr.title));
            }
          });
          setExistingAttributes(Array.from(allAttrs));
        }
      } catch (error) {
        console.error("Error cargando datos auxiliares", error);
      }
    };
    fetchData();
  }, []);

  // --- Inicializar Formulario (Editar) ---
  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: initialData.name || '',
        sku: initialData.sku || '',
        barcode: initialData.barcode || '',
        description: initialData.description || '',
        location: initialData.location || '', // <--- CARGAMOS LA UBICACIÓN SI EXISTE
        price: initialData.price || '',
        cost_price: initialData.cost_price || '',
        product_type: initialData.product_type || 'product',
        status: initialData.status || 'active',
        category_id: initialData.category_id || '',
        supplier_id: initialData.supplier_id || '',
        weight: initialData.weight || '',
        height: initialData.height || '',
        width: initialData.width || '',
        depth: initialData.depth || '',
      });

      if (initialData.category_name) setCatSearch(initialData.category_name);
      if (initialData.supplier_name) setSupSearch(initialData.supplier_name);

      if (initialData.custom_fields) {
        let parsedFields = {};
        if (typeof initialData.custom_fields === 'string') {
          try { parsedFields = JSON.parse(initialData.custom_fields); } catch (e) { parsedFields = {}; }
        } else {
          parsedFields = initialData.custom_fields;
        }
        const fieldsArray = Object.entries(parsedFields).map(([key, value]) => ({
          title: key, description: value
        }));
        setCustomFields(fieldsArray);
      }
    } else {
      setCustomFields([]); 
    }
  }, [initialData, isEditing]);

  // --- Manejadores ---
  const addCustomField = () => setCustomFields([...customFields, { title: '', description: '' }]);
  
  const removeCustomField = (index) => {
    const newFields = [...customFields];
    newFields.splice(index, 1);
    setCustomFields(newFields);
  };

  const handleCustomFieldChange = (index, field, value) => {
    const newFields = [...customFields];
    newFields[index][field] = value;
    setCustomFields(newFields);
    if (field === 'title') setActiveAttributeIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const customFieldsObj = {};
    customFields.forEach(field => {
      if (field.title.trim()) customFieldsObj[field.title] = field.description;
    });

    const payload = {
      ...formData, // <--- ESTO INCLUYE AUTOMÁTICAMENTE 'location'
      price: parseFloat(formData.price),
      cost_price: parseFloat(formData.cost_price),
      category_id: parseInt(formData.category_id),
      supplier_id: parseInt(formData.supplier_id),
      weight: parseFloat(formData.weight || 0),
      height: parseFloat(formData.height || 0),
      width: parseFloat(formData.width || 0),
      depth: parseFloat(formData.depth || 0),
      custom_fields: customFieldsObj,
      stock_quantity: isEditing ? undefined : 0 
    };

    const url = isEditing ? `${PRODUCTS_ENDPOINT}/${initialData.id}` : PRODUCTS_ENDPOINT;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        throw new Error(data.message || 'Error al guardar');
      }
    } catch (error) {
      onError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCats = categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()));
  const filteredSups = suppliers.filter(s => s.name.toLowerCase().includes(supSearch.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-10">
      <div className="flex justify-between items-center border-b pb-4">
         <h2 className="text-2xl font-bold text-gray-900">
           {isEditing ? 'Modificar Producto' : 'Nuevo Producto'}
         </h2>
         <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
           <XMarkIcon className="h-8 w-8" />
         </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        
        {/* SECCIÓN 1: INFO BÁSICA */}
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Detalles Generales</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Nombre del Producto *</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">SKU *</label>
            <input type="text" required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Código de Barras</label>
             <input type="text" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </div>
          
          {/* --- NUEVO INPUT DE UBICACIÓN --- */}
          <div>
             <label className="block text-sm font-medium text-gray-700">Ubicación en Almacén</label>
             <input 
               type="text" 
               placeholder="Ej: Pasillo A-12"
               value={formData.location} 
               onChange={e => setFormData({...formData, location: e.target.value})} 
               className="mt-1 block w-full p-2 border border-gray-300 rounded-md" 
             />
          </div>

          <div className="md:col-span-3">
             <label className="block text-sm font-medium text-gray-700">Descripción</label>
             <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        {/* SECCIÓN 2: CATEGORÍA Y PROVEEDOR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Categoría *</label>
            <input type="text" placeholder="Buscar..." required value={catSearch}
              onChange={e => { setCatSearch(e.target.value); setShowCatDrop(true); }}
              onFocus={() => setShowCatDrop(true)}
              onBlur={() => setTimeout(() => setShowCatDrop(false), 200)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
            {showCatDrop && (
              <ul className="absolute z-20 w-full bg-white border mt-1 max-h-40 overflow-y-auto shadow-lg">
                {filteredCats.map(c => (
                  <li key={c.id} onMouseDown={() => { setFormData({...formData, category_id: c.id}); setCatSearch(c.name); }} className="p-2 hover:bg-green-50 cursor-pointer text-sm">{c.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Proveedor *</label>
            <input type="text" placeholder="Buscar..." required value={supSearch}
              onChange={e => { setSupSearch(e.target.value); setShowSupDrop(true); }}
              onFocus={() => setShowSupDrop(true)}
              onBlur={() => setTimeout(() => setShowSupDrop(false), 200)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
            {showSupDrop && (
              <ul className="absolute z-20 w-full bg-white border mt-1 max-h-40 overflow-y-auto shadow-lg">
                {filteredSups.map(s => (
                  <li key={s.id} onMouseDown={() => { setFormData({...formData, supplier_id: s.id}); setSupSearch(s.name); }} className="p-2 hover:bg-green-50 cursor-pointer text-sm">{s.name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* SECCIÓN 3: PRECIOS */}
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 pt-4">Precios</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio Venta *</label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="block w-full pl-7 p-2 border rounded-md border-gray-300" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Costo</label>
            <div className="relative mt-1 rounded-md shadow-sm">
               <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="block w-full pl-7 p-2 border rounded-md border-gray-300" />
            </div>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Estado</label>
             <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white">
               <option value="active">Activo</option>
               <option value="discontinued">Descontinuado</option>
               <option value="out_of_stock">Sin Stock</option>
             </select>
          </div>
        </div>

        {/* SECCIÓN 4: DIMENSIONES */}
        <div className="grid grid-cols-4 gap-4 mt-4">
           <div><label className="text-xs text-gray-500">Peso (kg)</label><input type="number" step="0.01" value={formData.weight} onChange={e=>setFormData({...formData, weight: e.target.value})} className="w-full border rounded p-1"/></div>
           <div><label className="text-xs text-gray-500">Alto (cm)</label><input type="number" step="0.01" value={formData.height} onChange={e=>setFormData({...formData, height: e.target.value})} className="w-full border rounded p-1"/></div>
           <div><label className="text-xs text-gray-500">Ancho (cm)</label><input type="number" step="0.01" value={formData.width} onChange={e=>setFormData({...formData, width: e.target.value})} className="w-full border rounded p-1"/></div>
           <div><label className="text-xs text-gray-500">Largo (cm)</label><input type="number" step="0.01" value={formData.depth} onChange={e=>setFormData({...formData, depth: e.target.value})} className="w-full border rounded p-1"/></div>
        </div>

        {/* SECCIÓN 5: CUSTOM FIELDS (ATRIBUTOS) */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-gray-700">Atributos Personalizados</h3>
             <button type="button" onClick={addCustomField} 
               className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-1">
               <PlusIcon className="h-4 w-4"/> Agregar Atributo
             </button>
          </div>
          
          {customFields.length === 0 && <p className="text-sm text-gray-500 italic">No hay atributos extra definidos.</p>}

          <div className="space-y-3">
            {customFields.map((field, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="relative w-1/2">
                   <input 
                    type="text" placeholder="Ej: Color, Voltaje..."
                    value={field.title}
                    onChange={e => handleCustomFieldChange(index, 'title', e.target.value)}
                    onFocus={() => setActiveAttributeIndex(index)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                   />
                   {activeAttributeIndex === index && existingAttributes.length > 0 && (
                     <ul className="absolute z-30 w-full bg-white border mt-1 max-h-32 overflow-y-auto shadow-lg">
                       {existingAttributes
                         .filter(attr => attr.toLowerCase().includes(field.title.toLowerCase()))
                         .map((attr, i) => (
                           <li key={i} 
                             onMouseDown={() => {
                               handleCustomFieldChange(index, 'title', attr);
                               setActiveAttributeIndex(null);
                             }}
                             className="p-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
                           >
                             {attr}
                           </li>
                       ))}
                     </ul>
                   )}
                </div>
                <div className="w-1/2">
                   <input 
                    type="text" placeholder="Ej: Rojo, 220V..."
                    value={field.description}
                    onChange={e => handleCustomFieldChange(index, 'description', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                   />
                </div>
                <button type="button" onClick={() => removeCustomField(index)} 
                  className="p-2 text-red-500 hover:bg-red-100 rounded-full">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* BOTONES */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300">
            {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>

      </form>
    </div>
  );
};