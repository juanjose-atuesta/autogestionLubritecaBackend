const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a la base de datos
const connection = require('./database/connection');
connection();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas existentes
app.use('/api/customers', require('./src/routers/customer'));
app.use('/api/historial', require('./src/routers/historialDB'));
app.use('/api/reservations', require('./src/routers/reservation'));
app.use('/api/users', require('./src/routers/user'));
app.use('/api/login', require('./src/routers/login'));
app.use('/api/pedidos', require('./src/routers/pedidos'));
app.use('/api/eventos', require('./src/routers/eventos'));
app.use('/api/', require('./src/routers/sse'));

// Nuevas rutas de admin para export/import a Excel
app.use('/api/admin', require('./src/admin/excelRouter'));

// Ruta raíz
app.get('/', (req, res) => {
  console.log('Recibida una solicitud GET en /');
  return res.status(200).send('Bienvenido a mi API con funcionalidad de export/import a Excel');
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor iniciado correctamente usando el puerto: ${PORT}`);
  console.log(`Endpoints de admin disponibles en: http://localhost:${PORT}/api/admin/`);
});
