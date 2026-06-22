const Pedido = require("../models/pedidos");

// Calcula el total sumando cantidad * precioUnitario de cada fila
// de cada arreglo de items (oil, FAire, FComb, FAA, otros).
// Cada fila tiene la forma [cantidad, referencia, precioUnitario].
function calcularPrecioTotal(body) {
  const grupos = [body.oil, body.FAire, body.FComb, body.FAA, body.otros];
  let total = 0;

  grupos.forEach(grupo => {
    if (!Array.isArray(grupo)) return;
    grupo.forEach(fila => {
      if (!Array.isArray(fila)) return;
      const cantidad = Number(fila[0]) || 0;
      const precioUnitario = Number(fila[2]) || 0;
      total += cantidad * precioUnitario;
    });
  });

  return total;
}

const getPedidos = (req, res) => {
  Pedido.find()
    .sort({ createdAt: -1 })
    .then(pedidos => {
      if (!pedidos) return res.status(404).send({
        status: "error",
        message: "No se encontraron pedidos"
      });
      return res.status(200).send({
        status: "success",
        pedidos
      });
    })
    .catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al obtener los pedidos"
      });
    });
};

const getPedidoById = (req, res) => {
  const id = req.params.id;
  Pedido.findById(id)
    .then(pedido => {
      if (!pedido) return res.status(404).send({
        status: "error",
        message: "No se encontró el pedido"
      });
      return res.status(200).send({
        status: "success",
        pedido
      });
    })
    .catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al obtener el pedido"
      });
    });
};

const addPedido = (req, res) => {
  let body = req.body;
  body.precioTotal = calcularPrecioTotal(body);

  let pedidoToSave = new Pedido(body);
  pedidoToSave.save()
    .then(pedidoSaved => {
      if (!pedidoSaved) return res.status(404).send({
        status: "error",
        message: "No se pudo guardar el pedido"
      });
      return res.status(200).send({
        status: "success",
        pedidoSaved
      });
    })
    .catch(e => {
      if (e?.name === 'ValidationError') {
        return res.status(400).send({
          status: 'error',
          message: 'Datos inválidos para crear el pedido',
          details: Object.fromEntries(Object.entries(e.errors || {}).map(([k, v]) => [k, v?.message]))
        });
      }
      if (e?.code === 11000) {
        return res.status(409).send({
          status: 'error',
          message: 'El pedido ya existe (campo único duplicado)',
          duplicateKey: e?.keyValue || e?.keyPattern
        });
      }
      console.error('Error addPedido:', e);
      return res.status(500).send({
        status: "error",
        message: "Error interno al guardar el pedido"
      });
    });
};

const editPedido = (req, res) => {
  const idPedido = req.params.id;
  const { vehicleMake, name, id, telephone, email, orden, EL, plate, mileage, oil, FAire, FComb, FAA, otros } = req.body;

  if (!idPedido) {
    return res.status(400).send({
      status: "error",
      message: "No se proporcionó el id"
    });
  }

  const camposActualizar = {
    vehicleMake, name, id, telephone, email, orden, EL, plate, mileage, oil, FAire, FComb, FAA, otros
  };
  camposActualizar.precioTotal = calcularPrecioTotal(camposActualizar);

  Pedido.findByIdAndUpdate(
    idPedido,
    { $set: camposActualizar },
    { new: true, runValidators: true }
  )
    .then(pedidoUpdated => {
      if (!pedidoUpdated) return res.status(404).send({
        status: "error",
        message: "No se encontró el pedido"
      });
      return res.status(200).send({
        status: "success",
        pedidoUpdated
      });
    })
    .catch(err => {
      if (err?.name === 'ValidationError') {
        return res.status(400).send({
          status: 'error',
          message: 'Datos inválidos para editar el pedido',
          details: Object.fromEntries(Object.entries(err.errors || {}).map(([k, v]) => [k, v?.message]))
        });
      }
      return res.status(500).send({
        status: "error",
        message: err.message
      });
    });
};

const deletePedido = (req, res) => {
  const idPedido = req.params.id;
  Pedido.findByIdAndDelete(idPedido)
    .then(pedidoDeleted => {
      if (!pedidoDeleted) return res.status(404).send({
        status: "error",
        message: "No se encontró el pedido"
      });
      return res.status(200).send({
        status: "success"
      });
    })
    .catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al eliminar el pedido"
      });
    });
};

module.exports = {
  getPedidos,
  getPedidoById,
  addPedido,
  editPedido,
  deletePedido
};
