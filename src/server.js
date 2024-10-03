const http = require('http');
const pool = require('../database/conexion_Pool.js');
const crearCliente = require('../database/conexion_Client.js');


const server = http.createServer((req, res) => {
    //Log el método HTTP
    console.log(`Método HTTP: ${req.method}`);

    if (req.method === 'GET' && req.url === '/hora-actual-cliente') {
        const cliente = crearCliente(); // Crear un nuevo cliente por cada solicitud

        // Conectar a la base de datos
        cliente.connect()
            .then(() => {
                console.log('Conectado a la base de datos');
                // Hacer una consulta
                return cliente.query('SELECT NOW()');
            })
            .then((resH) => {
                // Enviar la respuesta al navegador
                res.end(JSON.stringify(resH.rows));
                console.log('Resultado de la consulta:', resH.rows);
            })
            .then(() => {
                // Cerrar la conexión
                return cliente.end();
            })
            .then(() => {
                console.log('Conexión cerrada');
            })
            .catch((err) => {
                console.error('Error ejecutando la consulta o cerrando la conexión:', err.stack);
                res.end('Error al ejecutar la consulta');
            });
    } else if (req.method === 'GET' && req.url === '/hora-actual-pool') {

        //cliente._connected == true ? cliente.end() : console.log("El cliente no estaba conectado")

        // Conectar a la base de datos
        pool.connect()
            .then(() => {
                console.log('Conectado a la base de datos');
                // Hacer una consulta
                return pool.query('SELECT NOW()');
            })
            .then((resH) => {
                //Enviar la respuesta al navegador
                res.end(JSON.stringify(resH.rows));
                console.log('Resultado de la consulta:', resH.rows);
            })
            .then(()=>{
                cliente.end();
                console.log(JSON.stringify(cliente));
            })
            .catch((err) => {
                console.error('Error ejecutando la consulta:', err.stack);
            });

    } else if (req.method === 'GET' && req.url === '/query-con-parametro') {
        // Parámetros de la consulta
        const id = 1;
        const id2 = 2;
        // Ojo que el método query recibe 3 parámetros: 
        //query(QUERY, PARAMETROS, FUNCTION)
        //query(QUERY, FUNCTION)
        //query(QUERY, PARAMETROS)

        pool.query('SELECT * FROM alumnos WHERE id = $1 OR id = $2', [id, id2])
            .then(resH => {
                res.end(JSON.stringify(resH.rows))
                console.table('Usuario:', resH.rows);
            })
            .catch(err => {
                console.error('Error ejecutando la consulta:', err.stack);
            });
    } else if (req.method === 'GET' && req.url === '/query-funcion-asincronica'){

        const obtenerAlumnos = async () => {
            try {
              const resA = await pool.query('SELECT * FROM alumnos');
              res.end(JSON.stringify(resA.rows));
              console.log('Alumnos:', resA.rows);
            } catch (err) {
              console.error('Error ejecutando la consulta:', err.stack);
            }
          }
          
          obtenerAlumnos();
    }
});

//Puerto de escucha del servidor
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

//exportar const server
module.exports = server;