/**
 * CONFIGURACIÓN DE BASE DE DATOS
 * - Configuración de conexión a MariaDB/MySQL
 * - Pool de conexiones para mejor rendimiento
 * - Función para obtener conexiones
 * - Manejo de variables de entorno para BD
 */
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'akima_user',
  password: process.env.DB_PASSWORD || 'fAvfeMnjOcVceeVo',
  database: process.env.DB_NAME || 'akima'
};

// Pool de conexiones para mejor rendimiento
const pool = mysql.createPool(dbConfig);

const getConnection = async () => {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
    throw error;
  }
};

module.exports = { getConnection, pool };