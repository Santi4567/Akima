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
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const productRoutes = require('./routes/productRoutes');
const clientRoutes = require('./routes/clientRoutes');
const visitRoutes = require('./routes/visitRoutes');
const orderRoutes = require('./routes/orderRoutes');
const returnRoutes = require('./routes/returnRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const financeRoutes = require('./routes/financeRoutes');
const companyRoutes = require('./routes/companyRoutes');
const contentRoutes = require('./routes/contentRoutes');
//const gmailRoutes = require('./routes/gmailRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const pdfRoutes = require('./routes/pdfRoutes');
//Arte ascii
const figlet = require('figlet');
const chalk = require('chalk');
const boxen = require('boxen');
const ora = require('ora');

const app = express();

// Middlewares globales
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL, // <-- 'process.env.FRONTEND_URL' es el mismo
  credentials: true 
}));
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
app.use('/api/payments', paymentRoutes); // Visitas 
app.use('/api/finance', financeRoutes);//Finanzas
app.use('/api/company', companyRoutes); //info de la compania 
app.use('/api/content/banners', contentRoutes); //baner de imagenes
//app.use('/api/gmail', gmailRoutes); // APIGmail
app.use('/api/pdf', pdfRoutes);

// HACER PÚBLICA LA CARPETA DE UPLOADS
// Esto permite acceder a http://localhost:3000/uploads/products/foto.jpg
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(chalk.cyan(figlet.textSync('ALKIMIA CRM', { horizontalLayout: 'full' })));

  const spinner = ora({ text: 'Inicializando servidor...', color: 'cyan' }).start();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.succeed(chalk.green('Servidor listo'));

  const info = boxen(
    `${chalk.bold('🚀 Puerto:')}   ${chalk.yellow(PORT)}\n` +
    `${chalk.bold('📦 Versión:')}  ${chalk.yellow('1.5')}\n` +
    `${chalk.bold('🌎 Entorno:')}  ${chalk.yellow(process.env.NODE_ENV || 'development')}`,
    {
      padding: 1,
      margin: 1,
      borderColor: 'cyan',
      borderStyle: 'round',
      title: 'Alkimia CRM',
      titleAlignment: 'center'
    }
  );

  console.log(info);
});

module.exports = app;
