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

# Autogestion Lubriteca Backend con Export/Import a Excel

Este es el backend para el sistema de gestión de lubricerías "Autogestion Lubriteca", ahora con funcionalidad añadida para exportar e importar la base de datos completa a formato Excel.

## Características

- ✅ Exportar toda la base de datos a un solo archivo Excel (.xlsx)
- � ✅ Importar desde archivo Excel para actualizar la base de datos
- � ✅ Soporte para todos los modelos: clientes, eventos, historial, usuarios, pedidos, reservas y credenciales
- � ✅ Formato de una sola hoja con todos los datos
- � ✅ Autorización requerida para operaciones de export/import (solo administradores)
- � ✅ Compatibilidad con archivos .xlsx y .xls
- � ✅ Límite de tamaño de archivo para prevenir abusos
- � ✅ Manejo apropiado de tipos de datos (fechas, números, booleanos, strings)
- � ✅ Operación upsert (actualizar si existe, crear si no) durante la importación

## Endpoints de Admin

### Exportar Base de Datos

```
GET /api/admin/export-excel
```

Exporta todos los datos de todos los modelos a un único archivo Excel con una sola hoja llamada "Todos los Datos".

**Autorización requerida**: Sí (ver sección de Autorización abajo)

**Respuesta**: Archivo Excel para descarga

- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename=autogestion_lubriteca_backup_YYYY-MM-DD.xlsx`

### Importar desde Excel

```
POST /api/admin/import-excel
```

Importa datos desde un archivo Excel y actualiza la base de datos usando operación upsert.

**Autorización requerida**: Sí (ver sección de Autorización abajo)

**Cuerpo de la solicitud**: `multipart/form-data`

- Campo: `excelFile` - Archivo Excel a importar

**Respuesta**: JSON con estadísticas delProcesso

```json
{
  "message": "Importación completada",
  "statistics": {
    "processed": 150,
    "created": 25,
    "updated": 125,
    "errors": 0,
    "errorDetails": []
  }
}
```

## Autorización

Los endpoints de export/import requieren autorización de administrador. Se pueden configurar de las siguientes formas:

### Opción 1: Token de Autorización (Recomendado)

1. Establecer la variable de entorno `ADMIN_EXPORT_IMPORT_TOKEN` con un valor secreto
2. Enviar el token en el header HTTP: `X-Admin-Token: tu_token_secreto_aqui`

### Opción 2: Acceso desde Localhost (Solo Desarrollo)

- Las peticiones que originan desde `127.0.0.1`, `::1` o `localhost` son autorizadas automáticamente
- **Solo recomendado para entornos de desarrollo y testing**

### Opción 3: Modo Desarrollo

- Establecer `NODE_ENV=development` y `ALLOW_LOCAL_ADMIN=true`
- Permite acceso desde localhost en entorno de desarrollo
- **NO usar en producción**

## Instalación

1. Copiar `.env.example` a `.env` y configurar las variables de entorno apropiadas
2. Ejecutar `npm install` para instalar dependencias
3. Iniciar el servidor con `npm start` o `node index.js`

## Dependencias Nuevas

- `exceljs`: Biblioteca para leer, modificar y escribir archivos Excel (.xlsx y .xls)

## Estructura de Datos en Excel

El archivo exportado tiene una sola hoja con la siguiente estructura:

| Tipo de Entidad | ID      | [Campo1]   | [Campo2] | ... | [CampoN] |
| --------------- | ------- | ---------- | -------- | --- | -------- |
| Customer        | 60a7... | Juan Pérez | 555-1234 | ... | ...      |
| Pedido          | 60a8... | ABC123     | 60a7...  | ... | ...      |
| ...             | ...     | ...        | ...      | ... | ...      |

- **Tipo de Entidad**: Nombre del modelo/MongoDB collection
- **ID**: Identificador único del documento (\_id de MongoDB)
- **Columnas restantes**: Todos los campos posibles de todos los modelos, ordenados alfabéticamente
- Los campos que no aplican para una determinada entidad quedan vacíos

## Notas de Implementación

### Exportación

- Todos los documentos de todos los modelos se recopilan
- Se determina el conjunto completo de columnas posibles
- Cada documento se aplana (eliminando nested objects) y se mapea a las columnas
- Se usa la biblioteca ExcelJS para generar el archivo .xlsx
- El archivo se envía directamente como buffer para evitar escritura en disco

### Importación

- Se lee el archivo Excel usando ExcelJS
- Se procesa fila por fila (ignoriendo la fila de encabezado)
- Para cada fila:
  1. Se identifica el tipo de entidad por la primera columna
  2. Se extrae el ID del documento por la segunda columna
  3. Se construye un objeto de datos desde las columnas restantes
  4. Se convierte el tipo de datos apropiado (string → number/date/boolean cuando sea posible)
  5. Se realiza operación upsert: actualiza el documento si existe por ID, lo crea si no existe
- Se recopilan estadísticas de procesamiento, creación, actualización y errores

## Seguridad

- Los endpoints solo están accesibles bajo `/api/admin/`
- Los archivos Excel están limitados a 10MB por defecto
- Se valida el tipo MIME del archivo antes de procesarlo
- Los errores de importación se reportan por fila para facilitar la depuración
- No se realizan operaciones destructivas (el import hace upsert, no reemplazo total)

## Pruebas

Para probar la funcionalidad:

1. **Exportar**:

   ```bash
   curl -H "X-Admin-Token: tu_token" \
        -o lubricerteca_backup_$(date +%Y%m%d).xlsx \
        http://localhost:3000/api/admin/export-excel
   ```

2. **Importar** (ejemplo con curl):

   ```bash
   curl -X POST -H "X-Admin-Token: tu_token" \
        -F "excelFile=@lubricerteca_backup_$(date +%Y%m%d).xlsx" \
        http://localhost:3000/api/admin/import-excel
   ```

## Mantenimiento

- Para añadir nuevos modelos al export/import, simplemente agréguelos al objeto `models` en `src/admin/excelRouter.js`
- El sistema detectará automáticamente nuevos campos y los agregará como columnas
- Los cambios en esquemas existentes se manejarán automáticamente en la próxima exportación/importación
