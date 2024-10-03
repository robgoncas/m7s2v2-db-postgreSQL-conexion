//Modulo npm node-postgres 
const { Pool, Client } = require("pg");

//URI de conexión en string 
const connectionString = 'postgresql://postgres:1234@localhost:5432/node-express-sequelize-postgresql-db';

//Conectando con una conexión al pool. 
const pool = new Pool({ connectionString });

pool.query('SELECT * FROM tutorials ORDER BY title;', (err, res) => {
    console.table(res.rows);
    pool.end();
});

const client = new Client({ connectionString});
client.connect();

client.query('SELECT * FROM tutorials ORDER BY title;', (err, res) => {
    console.table(res.rows);
    client.end();
});