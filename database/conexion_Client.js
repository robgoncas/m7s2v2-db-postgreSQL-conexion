
const { Client } = require('pg');

// Crear un cliente con los detalles de la conexión
function crearCliente() {
    return new Client({
    user: 'postgres', 
    host: 'localhost', 
    database: 'edutecno', 
    password: '1234', 
    port: 5432
})
};

module.exports = crearCliente;
