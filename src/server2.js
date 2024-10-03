const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'db_modulo7',
    password: '1234',
    port: 5432,
});

//Parsear JSON
app.use(express.json());

//1. Endpoint: Crear un usuario con JSON
app.post('/create-user', async (req, res) => {
    //email y name
    const nombre = req.body.nombre;
    const detalle = req.body.detalle;


    try {

        const result = await pool.query('INSERT INTO usuarios(nombre, detalles) VALUES($1, $2) RETURNING *', [nombre, detalle]);
        res.status(201).json({ message: 'Usuario creado', user: result.rows[0] });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//2. Endpoint: Seleccionar información de usuario desde JSON
app.get('/get-user/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [userId]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//3. Endpoint: Consulta parametrizada (Prepared Statement)
app.get('/get-user-by-email/:email', async (req, res) => {

    const email = req.params.email;

    try {
        // const query = {
        //     text: 'SELECT * FROM usuarios WHERE detalles->>\'email\' = $1',
        //     values: [email]
        // };

        const result = await pool.query('SELECT * FROM usuarios WHERE detalles->>\'email\' = $1',[email]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//4. Endpoint: Consulta con `rowMode: 'array'`
//Devuelve los resultados en formato array
app.get('/get-all-users-array', async (req, res) => {
    try {
        const query = {
            text: 'SELECT detalles->>\'email\', detalles->>\'age\' FROM usuarios',
            rowMode: 'array'
        };

        const query2 = {
            text: 'SELECT detalles FROM usuarios'
        };

        const result = await pool.query(query);
        const result2 = await pool.query(query2);

        //Resultado como array
        res.json({result: result.rows, result2: result2.rows}); 
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
