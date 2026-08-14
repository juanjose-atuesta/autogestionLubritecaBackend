const express = require('express');
const multer = require('multer');
const router = express.Router();
const ExcelService = require('../services/excelService');

// Almacenamiento en memoria para recibir el archivo Excel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Middleware simple de autorización para admin
// En una implementación real, esto sería más robusto (JWT, sesiones, etc.)
const adminAuth = (req, res, next) => {
  // Opción 1: Verificar token personalizado en header
  const adminToken = req.headers['x-admin-token'];
  const expectedToken = process.env.ADMIN_EXPORT_IMPORT_TOKEN;

  if (adminToken && expectedToken && adminToken === expectedToken) {
    return next();
  }

  // Opción 2: Verificar si viene de localhost (solo para desarrollo/testing)
  if (req.ip === '127.0.0.1' || req.ip === '::1' || req.hostname === 'localhost') {
    return next();
  }

  // Opción 3: Verificar variable de entorno para modo desarrollo
  if (process.env.NODE_ENV === 'development' && process.env.ALLOW_LOCAL_ADMIN === 'true') {
    return next();
  }

  // Si ninguna condición se cumple, denegar acesso
  return res.status(403).json({
    error: 'Acceso denegado. Se requieren permisos de administrador para esta operación.'
  });
};

// Endpoint para exportar toda la base de datos a Excel
router.get('/export-excel', adminAuth, async (req, res) => {
  try {
    // Importar modelos dinámicamente para evitar dependencias circulares
    const Customer = require('../models/customer');
    const Evento = require('../models/eventos');
    const HistorialDB = require('../models/historialDB');
    const Login = require('../models/login');
    const Pedido = require('../models/pedidos');
    const Reservation = require('../models/reservation');
    const User = require('../models/user');

    // Colección de modelos para el servicio
    const models = {
      Customer,
      Evento,
      HistorialDB,
      Login,
      Pedido,
      Reservation,
      User
    };

    const excelService = new ExcelService(models);
    const excelBuffer = await excelService.exportAllToExcel();

    // Configurar headers para descarga de archivo
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=autogestion_lubriteca_backup_' +
        new Date().toISOString().slice(0, 10) +
        '.xlsx'
    );

    // Enviar el buffer como respuesta
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error en export-excel:', error);
    res.status(500).json({
      error: 'Error interno del servidor al exportar datos',
      details: error.message
    });
  }
});

// Endpoint para importar desde Excel
router.post('/import-excel', adminAuth, upload.single('excelFile'), async (req, res) => {
  try {
    // Verificar que se envió un archivo
    if (!req.file) {
      return res.status(400).json({
        error: 'No se proporcionó ningún archivo Excel para importar'
      });
    }

    const excelFile = req.file;

    // Validar tipo de archivo
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];

    if (!allowedMimeTypes.includes(excelFile.mimetype)) {
      return res.status(400).json({
        error: 'Tipo de archivo no válido. Se requiere un archivo Excel (.xlsx o .xls)'
      });
    }

    // Validar tamaño (limitar a 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (excelFile.size > maxSize) {
      return res.status(400).json({
        error: `El archivo es demasiado grande. Tamaño máximo permitido: ${maxSize / (1024 * 1024)}MB`
      });
    }

    // Importar modelos dinámicamente
    const Customer = require('../models/customer');
    const Evento = require('../models/eventos');
    const HistorialDB = require('../models/historialDB');
    const Login = require('../models/login');
    const Pedido = require('../models/pedidos');
    const Reservation = require('../models/reservation');
    const User = require('../models/user');

    // Colección de modelos para el servicio
    const models = {
      Customer,
      Evento,
      HistorialDB,
      Login,
      Pedido,
      Reservation,
      User
    };

    const excelService = new ExcelService(models);
    const stats = await excelService.importFromExcel(excelFile.buffer);

    res.json({
      message: 'Importación completada',
      statistics: stats
    });
  } catch (error) {
    console.error('Error en import-excel:', error);
    res.status(500).json({
      error: 'Error interno del servidor al importar datos',
      details: error.message
    });
  }
});

module.exports = router;