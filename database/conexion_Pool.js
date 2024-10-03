//Modulo npm node-postgres 
const { Pool } = require('pg');

//Datos para la conexión a la base de datos 
const pool = 
new Pool({ 
            user: 'postgres', 
            host: 'localhost', 
            database: 'edutecno', 
            password: '1234', 
            port: 5432
        });

module.exports = pool;