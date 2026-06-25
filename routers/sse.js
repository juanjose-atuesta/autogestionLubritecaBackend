// En tu archivo de rutas (puede ser en una ruta general o en cada router)
const { agregarCliente, eliminarCliente } = require('../utils/sse');

const express = require('express');
const router = express.Router();
router.get('/eventos', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Mandar un ping inicial para confirmar conexión
  res.write('event: conectado\ndata: {}\n\n');

  agregarCliente(res);

  // Cuando el cliente cierra la pestaña/conexión, limpiar
  req.on('close', () => eliminarCliente(res));
});

module.exports = router;
