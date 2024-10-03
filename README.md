

## Tabla de Contenidos

- [Tabla de Contenidos](#tabla-de-contenidos)
- [1. ¿Qué es SQL Injection?](#1-qué-es-sql-injection)
  - [**Ejemplo de Vulnerabilidad a SQL Injection**](#ejemplo-de-vulnerabilidad-a-sql-injection)
  - [**Prevención de SQL Injection**](#prevención-de-sql-injection)
- [2. Objeto JSON como Argumento de Consultas desde Node.js con `pg`](#2-objeto-json-como-argumento-de-consultas-desde-nodejs-con-pg)
  - [**Ejemplo Práctico**](#ejemplo-práctico)
  - [**Insertar un Registro con Objeto JSON**](#insertar-un-registro-con-objeto-json)
  - [**Consultar Productos por Marca**](#consultar-productos-por-marca)
  - [-\> -\>\> (Operadores de Acceso a Obj JSON)](#----operadores-de-acceso-a-obj-json)
  - [**Obtener Especificaciones de RAM**](#obtener-especificaciones-de-ram)
- [3. Declaraciones Preparadas en `pg` en tu Servidor Node.js](#3-declaraciones-preparadas-en-pg-en-tu-servidor-nodejs)
  - [**Ejemplo Práctico**](#ejemplo-práctico-1)
    - [**Preparar e Ejecutar una Consulta Parametrizada**](#preparar-e-ejecutar-una-consulta-parametrizada)
    - [**Uso de `prepare` para Mejorar el Rendimiento**](#uso-de-prepare-para-mejorar-el-rendimiento)
- [4. Modo Fila (Row Mode) para las Queries con `pool.query()`](#4-modo-fila-row-mode-para-las-queries-con-poolquery)
  - [Ejemplo en modo objeto (predeterminado):](#ejemplo-en-modo-objeto-predeterminado)
  - [Modo Fila: `rowMode: 'array'`](#modo-fila-rowmode-array)
  - [¿Cuándo usarlo?](#cuándo-usarlo)

---

## 1. ¿Qué es SQL Injection?

**SQL Injection** es una vulnerabilidad de seguridad que permite a un atacante interferir con las consultas que una aplicación realiza a su base de datos. Ocurre cuando las entradas proporcionadas por el usuario no se validan ni sanitizan adecuadamente, permitiendo que código SQL malicioso sea ejecutado.

### **Ejemplo de Vulnerabilidad a SQL Injection**

Supongamos que tienes una aplicación Node.js que autentica usuarios de la siguiente manera:

```javascript
const { Pool } = require('pg');
const pool = new Pool({
  // Configuración de la conexión
});

async function autenticarUsuario(username, password) {
  const query = `
    SELECT * FROM usuarios 
    WHERE username = '${username}' AND password = '${password}';
  `;
  
  const res = await pool.query(query);
  return res.rows;
}
```

Si un atacante ingresa `admin' --` como `username` y cualquier valor como `password`, la consulta resultante sería:

```sql
SELECT * FROM usuarios 
WHERE username = 'admin' --' AND password = 'cualquier_valor';
```

El `--` comenta el resto de la consulta, lo que puede permitir al atacante acceder sin una contraseña válida.

### **Prevención de SQL Injection**

La mejor manera de prevenir SQL Injection es utilizando **Declaraciones Preparadas** o **Consultas Parametrizadas**, que separan el código SQL de los datos proporcionados por el usuario.

---

## 2. Objeto JSON como Argumento de Consultas desde Node.js con `pg`

PostgreSQL soporta los tipos de datos `JSON` y `JSONB`, lo que permite almacenar y manipular datos en formato JSON. Desde una aplicación Node.js, puedes enviar objetos JSON como argumentos en tus consultas.

### **Ejemplo Práctico**

Supongamos que tienes una tabla `productos` con una columna `detalles` de tipo `JSONB`:

```sql
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    detalles JSONB
);
```

### **Insertar un Registro con Objeto JSON**

```javascript
const { Pool } = require('pg');
const pool = new Pool({
  // Configuración de la conexión
});

async function insertarProducto(nombre, detalles) {
  const query = {
    text: 'INSERT INTO productos (nombre, detalles) VALUES ($1, $2) RETURNING *',
    values: [nombre, detalles],
  };
  
  const res = await pool.query(query);
  return res.rows[0];
}

// Uso de la función
const nuevoProducto = {
  marca: "Dell",
  especificaciones: {
    procesador: "Intel i7",
    RAM: "16GB",
    almacenamiento: "512GB SSD"
  }
};

insertarProducto('Laptop', nuevoProducto)
  .then(producto => console.log(producto))
  .catch(err => console.error(err));
```

### **Consultar Productos por Marca**

### -> ->> (Operadores de Acceso a Obj JSON)

```javascript
async function obtenerProductosPorMarca(marca) {
  const query = {
    text: 'SELECT * FROM productos WHERE detalles ->> \'marca\' = $1',
    values: [marca],
  };
  
  const res = await pool.query(query);
  return res.rows;
}

// Uso de la función
obtenerProductosPorMarca('Dell')
  .then(productos => console.log(productos))
  .catch(err => console.error(err));
```

### **Obtener Especificaciones de RAM**

```javascript
async function obtenerRAMProducto(nombre) {
  const query = {
    text: `
      SELECT detalles->'especificaciones'->>'RAM' AS ram 
      FROM productos 
      WHERE nombre = $1
    `,
    values: [nombre],
  };
  
  const res = await pool.query(query);
  return res.rows[0].ram;
}

// Uso de la función
obtenerRAMProducto('Laptop')
  .then(ram => console.log(`RAM: ${ram}`))
  .catch(err => console.error(err));
```

---
## 3. Declaraciones Preparadas en `pg` en tu Servidor Node.js

Las **Declaraciones Preparadas** o **Consultas Parametrizadas** permiten definir una consulta con parámetros placeholders (`$1`, `$2`, etc.) que se pueden reutilizar con diferentes valores. Esto no solo mejora el rendimiento, sino que también protege contra SQL Injection.

### **Ejemplo Práctico**

#### **Preparar e Ejecutar una Consulta Parametrizada**

```javascript
const { Pool } = require('pg');
const pool = new Pool({
  // Configuración de la conexión
});

async function insertarUsuario(username, password) {
  const query = {
    text: 'INSERT INTO usuarios (username, password) VALUES ($1, $2) RETURNING *',
    values: [username, password],
  };
  
  const res = await pool.query(query);
  return res.rows[0];
}

// Uso de la función
insertarUsuario('nuevo_usuario', 'secure_password')
  .then(usuario => console.log(usuario))
  .catch(err => console.error(err));
```

#### **Uso de `prepare` para Mejorar el Rendimiento**

Si vas a ejecutar la misma consulta múltiples veces, puedes preparar la consulta para optimizar el rendimiento:

```javascript
async function prepararInsercionUsuario() {
  await pool.query('PREPARE insertar_usuario (VARCHAR, VARCHAR) AS INSERT INTO usuarios (username, password) VALUES ($1, $2)');
}

async function ejecutarInsercionUsuario(username, password) {
  const query = {
    text: 'EXECUTE insertar_usuario($1, $2)',
    values: [username, password],
  };
  
  const res = await pool.query(query);
  return res.rows[0];
}

// Preparar la declaración al inicio de la aplicación
prepararInsercionUsuario()
  .then(() => {
    // Luego puedes ejecutar inserciones
    return ejecutarInsercionUsuario('usuario1', 'password1');
  })
  .then(usuario => console.log(usuario))
  .catch(err => console.error(err));
```

**Nota:** El uso de declaraciones preparadas explícitas (`PREPARE` y `EXECUTE`) es menos común en aplicaciones Node.js debido a que el módulo `pg` ya maneja consultas parametrizadas de manera eficiente. Sin embargo, conocer este método puede ser útil en ciertos escenarios.

---

## 4. Modo Fila (Row Mode) para las Queries con `pool.query()`


Por defecto, **node-postgres** (pg) devuelve las filas de una consulta SQL como objetos de JavaScript. Las claves de estos objetos coinciden con los nombres de las columnas, y los valores corresponden a los datos de cada fila.

### Ejemplo en modo objeto (predeterminado):
Cuando ejecutas una consulta sin especificar el modo fila, node-postgres devolverá las filas como objetos de JavaScript:

```javascript
const query = {
  text: 'SELECT $1::text as first_name, $2::text as last_name',
  values: ['Brian', 'Carlson'],
};

pool.query(query)
  .then(res => console.log(res.rows[0]))
  .catch(e => console.error(e.stack));
```

En este caso, el resultado sería:
```json
{
  "first_name": "Brian",
  "last_name": "Carlson"
}
```

### Modo Fila: `rowMode: 'array'`

Si no deseas que los resultados se devuelvan como objetos, puedes configurar la consulta para que el analizador de resultados devuelva las filas como matrices de valores. Esto es útil en situaciones donde solo te interesa el valor sin importar el nombre de las columnas, y puede optimizar el rendimiento en algunas circunstancias.

Para activar este comportamiento, debes pasar la opción `rowMode: 'array'` en el objeto de consulta. Aquí tienes un ejemplo:

```javascript
const query = {
  text: 'SELECT $1::text as first_name, $2::text as last_name',
  values: ['Brian', 'Carlson'],
  rowMode: 'array', // Devuelve las filas como arrays
};

pool.query(query)
  .then(res => console.log(res.rows[0]))
  .catch(e => console.error(e.stack));
```

En este caso, el resultado sería una matriz:
```json
["Brian", "Carlson"]
```

### ¿Cuándo usarlo?
El modo de fila en matriz puede ser útil si:
- Necesitas una mayor eficiencia al trabajar con grandes volúmenes de datos.
- No te interesa el nombre de las columnas, solo los valores.
- Prefieres procesar los resultados de forma posicional, por ejemplo, al trabajar con una gran cantidad de filas en las que las etiquetas de columna son irrelevantes.

