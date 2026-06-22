const express = require('express');
const router = express.Router();
const PedidosController = require("../controllers/pedidos");

router.get('/getPedidos', PedidosController.getPedidos);
router.get('/getPedido/:id', PedidosController.getPedidoById);
router.post('/addPedido', PedidosController.addPedido);
router.patch('/editPedido/:id', PedidosController.editPedido);
router.delete('/deletePedido/:id', PedidosController.deletePedido);

module.exports = router;
