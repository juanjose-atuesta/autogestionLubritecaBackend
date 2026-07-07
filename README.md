# 🚗 Autogestión Lubriteca - Backend API

![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-black?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Estado](https://img.shields.io/badge/Estado-Desplegado-brightgreen)

Backend REST para la gestión de clientes y su historial en un sistema de autogestión para lubriteca.

---

## ✨ Stack

- **Node.js + Express**
- **MongoDB + Mongoose**
- **CORS**
- **Nodemon** para desarrollo
- **PM2** para gestión del proceso en producción

---

## 📁 Estructura del proyecto

```bash
autogestionLubritecaBackend/
├── controllers/
│   ├── customer.js
│   └── historialDB.js
├── database/
│   └── connection.js
├── models/
│   ├── customer.js
│   └── historialDB.js
├── objetivo/
├── routers/
│   ├── customer.js
│   └── historialDB.js
├── utils/
├── index.js
├── package-lock.json
└── package.json
```

---

## 🚀 Instalación

```bash
# 1) Clonar el repositorio
git clone https://github.com/juanjose-atuesta/autogestionLubritecaBackend.git

# 2) Entrar al proyecto
cd autogestionLubritecaBackend

# 3) Instalar dependencias
npm install

# 4) Prueba rápida de arranque
npm start
# Salir de la ejecución con: Ctrl + C

# 5) Instalar PM2 globalmente
npm install -g pm2

# 6) Ejecutar el servidor con PM2
pm2 start index.js
```

Servidor por defecto: **`http://localhost:3000`**

> Actualmente la conexión a MongoDB está definida en código como:
> `mongodb://127.0.0.1:27017/autogestionLubritecaDB`

---

## 🔄 Instrucciones para actualizaciones

```bash
# 1) Entrar al directorio del proyecto clonado
cd autogestionLubritecaBackend

# 2) Detener el proceso actual en PM2
pm2 stop index.js

# 3) Traer cambios desde main
git pull origin main

# Si hay conflictos y quieres aceptar los cambios remotos:
git pull -X theirs origin main

# 4) Volver a iniciar el servidor
pm2 start index.js
```

---

## 📌 Notas

- El proyecto usa **CommonJS** (`require/module.exports`).
- El script `test` aún no está implementado.
- Algunas propiedades de esquema (`createAt`, `updateAt`, `entryDate`) están manejadas como `String`.

---

## 👨‍🔧 Autor

Proyecto backend para **Autogestión Lubriteca**.
