# 🚗 Autogestión Lubriteca - Backend API

![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-black?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-orange)

Backend REST para la gestión de clientes y su historial en un sistema de autogestión para lubriteca.

---

## ✨ Stack

- **Node.js + Express**
- **MongoDB + Mongoose**
- **CORS**
- **Nodemon** para desarrollo

---

## 📁 Estructura del proyecto

```bash
backend/
├── controllers/
│   ├── customer.js
│   └── historialDB.js
├── database/
│   └── connection.js
├── models/
│   ├── customer.js
│   └── historialDB.js
├── routers/
│   ├── customer.js
│   └── historialDB.js
├── index.js
└── package.json
```

---

## 🚀 Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Levantar el servidor

```bash
npm start
```

Servidor por defecto: **`http://localhost:3000`**

> Actualmente la conexión a MongoDB está definida en código como:
> `mongodb://127.0.0.1:27017/autogestionLubritecaDB`

---

## 🧩 Endpoints

Base URL: `http://localhost:3000`

### 👥 Clientes (`/api/customers`)

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/customers/customersList` | Lista todos los clientes |
| GET | `/api/customers/listByPlate/:plate` | Busca por placa |
| GET | `/api/customers/listByName/:name` | Busca por nombre (regex, case-insensitive) |
| GET | `/api/customers/listByTelephone/:telephone` | Busca por teléfono |
| GET | `/api/customers/listByService/:service` | Busca por servicio |
| GET | `/api/customers/listCustomersContacted` | Lista clientes contactados |
| POST | `/api/customers/addCustomer` | Crea un cliente |
| PUT | `/api/customers/editCustomer` | Edita un cliente por `id` (en body) |
| PATCH | `/api/customers/toogleWasContacted/:id` | Alterna `wasContacted` |

### 🗂️ Historial (`/api/historial`)

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/historial/saveToHistorialDB` | Guarda un registro en historial |
| GET | `/api/historial/historialDBList` | Lista historial completo |

---

## 🧪 Endpoint de prueba

```http
GET /
```

Respuesta:

```text
Bienvenido a mi API
```

---

## 📝 Ejemplo de payload (cliente)

```json
{
  "name": "JUAN PEREZ",
  "telephone": "3001234567",
  "plate": "ABC123",
  "estate": "ALDIA",
  "wasContacted": false,
  "entryDate": "2026-04-18",
  "nextContact": "2026-05-18",
  "mileage": "120000",
  "service": "Cambio de aceite",
  "createAt": "2026-04-18",
  "updateAt": "undefined",
  "id": "1713400000000"
}
```

---

## 📌 Notas

- El proyecto usa **CommonJS** (`require/module.exports`).
- El script `test` aún no está implementado.
- Algunas propiedades de esquema (`createAt`, `updateAt`, `entryDate`) están manejadas como `String`.

---

## 👨‍🔧 Autor

Proyecto backend para **Autogestión Lubriteca**.
