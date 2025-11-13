/**
 * ARCHIVO PRINCIPAL DE LA APLICACIÓN
 * - Configura Express y middlewares globales
 * - Importa y registra todas las rutas
 * - Inicia el servidor
 * - Punto de entrada de la aplicación
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const productRoutes = require('./routes/productRoutes');
const clientRoutes = require('./routes/clientRoutes');
const visitRoutes = require('./routes/visitRoutes');
const orderRoutes = require('./routes/orderRoutes');
const returnRoutes = require('./routes/returnRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middlewares globales
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// Rutas
app.use('/api/users', userRoutes); //Usuarios & Login
app.use('/api/categories', categoryRoutes); //Categorias
app.use('/api/suppliers', supplierRoutes);//Proveedores 
app.use('/api/products', productRoutes); // Productos 
app.use('/api/clients', clientRoutes); // Clientes
app.use('/api/visits', visitRoutes); // Visitas 
app.use('/api/orders', orderRoutes); // Orders 
app.use('/api/returns', returnRoutes); // Visitas 



// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});

module.exports = app;
