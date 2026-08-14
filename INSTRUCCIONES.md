# �� 🚀 Instrucciones para poner en marcha la funcionalidad de Export/Import a Excel

## �� 📋 Pré-requisitos

- Node.js >= 14.0.0
- MongoDB en ejecución (local o remoto)
- Git (para versionado)

## �� 🔧 Instalación

1. **Clonar o copiar esta carpeta** (ya estás aquí si estás leyendo esto)

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   # Luego editar .env con tus valores apropiados
   ```

   Variables importantes para la funcionalidad de export/import:
   - `ADMIN_EXPORT_IMPORT_TOKEN`: Token secreto para autorización (recomendado)
   - `ALLOW_LOCAL_ADMIN`: Establecer a `true` solo en desarrollo para permitir acceso desde localhost
   - `NODE_ENV`: `development` o `production`

4. **Verificar conexión a MongoDB**:
   Asegúrate de que MongoDB esté ejecutándose y accesible mediante la URI en tu archivo .env

## � ▶��️ Ejecución

### Modo Desarrollo (recomendado para pruebas):
```bash
npm run dev
# o
npm start
```

### Modo Producción:
```bash
npm start
```

El servidor se iniciará en el puerto configurado (por defecto 3000).

## �� 🧪 Ejecutar Tests

```bash
npm test
```

Para tests con watch mode (desarrollo):
```bash
npm run test:watch
```

Para ver reporte de cobertura:
```bash
npm test
# Luego abrir coverage/lcov-report/index.html en tu navegador
```

## �� 📤 Uso de la Funcionalidad

### Exportar Base de Datos a Excel

Con curl (reemplaza TU_TOKEN):
```bash
curl -H "X-Admin-Token: TU_TOKEN" \
     -o lubricerteca_backup_$(date +%Y%m%d).xlsx \
     http://localhost:3000/api/admin/export-excel
```

O desde el navegador (si configuraste acceso localhost):
```
http://localhost:3000/api/admin/export-excel
```

### Importar desde Excel

Con curl (reemplaza TU_TOKEN y ruta al archivo):
```bash
curl -X POST -H "X-Admin-Token: TU_TOKEN" \
     -F "excelFile=@ruta/a/tu/archivo.xlsx" \
     http://localhost:3000/api/admin/import-excel
```

## �� 🔐 Seguridad y Autorización

La funcionalidad de export/import está protegida y solo accesible por administradores. Los métodos de autorización disponibles son:

1. **Token Personalizado (Recomendado)**
   - Establece `ADMIN_EXPORT_IMPORT_TOKEN` en tu archivo .env
   - Incluye el header `X-Admin-Token: [tu_token]` en todas las peticiones

2. **Acceso desde Localhost** 
   - Solo funciona si la petición viene de `127.0.0.1`, `::1` o `localhost`
   - **NO SE RECOMIENDA EN PRODUCCIÓN**

3. **Modo Desarrollo**
   - Establece `NODE_ENV=development` y `ALLOW_LOCAL_ADMIN=true` en .env
   - **SOLO PARA ENTORNOS DE DESARROLLO Y TESTING**

## �� 📂 Estructura de Proyecto

```
Actualizacion_spectre/
├── src/
│   ├── admin/
│   │   └── excelRouter.js      # Routers de export/import
│   ├── services/
│   │   └── excelService.js     # Lógica principal de export/import
│   ├── models/                 # Tus modelos existentes (debes copiarlos)
│   ├── routes/                 # Tus routers existentes (debes copiarlos)
│   └── index.js                # Servidor principal actualizado
├── test/
│   └── excelService.test.js    # Tests unitarios
├── .env.example                # Plantilla de variables de entorno
├── package.json                # Dependencias y scripts
├── README.md                   # Documentación completa
�└── INSTRUCCIONES.md          # Este archivo
```

## �� 🔄 Integración con tu Código Existente

Para integrar esta funcionalidad en tu repositorio principal:

1. Copiar `src/services/excelService.js` a tu proyecto
2. Copiar `src/admin/excelRouter.js` a tu proyecto
3. Actualizar tu `index.js` principal para montar el router:
   ```javascript
   app.use('/api/admin', require('./admin/excelRouter'));
   ```
4. Agregar `"exceljs": "^4.4.0"` a tus dependencias en package.json
5. Copiar las medidas de seguridad (middelware de auth) según tus necesidades
6. Asegurarte de que tus modelos estén disponibles para ser requeridos

## �� ⚠��️ Consideraciones Importantes

### Rendimiento
- La exportación consulta todos los documentos de todas las colecciones
- En bases de datos muy grandes, considerar agregar paginación o límites
- La importación procesa fila por fila y hace operaciones individuales de base de datos
- Para datasets muy grandes, considerar operaciones en lote

### Compatibilidad
- Funciona con archivos .xlsx y .xls
- Los IDs de MongoDB se preservan como strings en Excel
- Las fechas se exportan en formato ISO y se convierten de vuelta al importar
- Los objetos anidados se aplantan usando notación de punto (ej: `address.street`)

### Extensibilidad
- Para añadir nuevos modelos al export/import, simplemente agréguelos al objeto `models` en `excelRouter.js`
- Cambios en esquemas de modelos se manejan automáticamente
- El sistema detecta dinámicamente todas las columnas posibles

## �� 🛡��️ Buenas Prácticas de Seguridad

1. **Nunca commits tus tokens reales** - Usa variables de entorno y .gitignore
2. **En producción, desactiva el acceso localhost** - Establece `ALLOW_LOCAL_ADMIN=false`
3. **Usa HTTPS en producción** - Los tokens viajan en headers y deben estar protegidos
4. **Monitorea el uso** - Considera agregar logging de quién exporta/importa y cuándo
5. **Limita la frecuencia** - En entornos de alta seguridad, considera rate limiting estos endpoints

## �� 📞 Soporte

Si tienes problemas o preguntas, revisa:
1. El archivo README.md para documentación completa
2. Los comentarios en el código fuente para detalles de implementación
3. Los tests en el directorio test/ para ejemplos de uso