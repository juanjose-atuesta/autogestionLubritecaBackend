const Pedido = require("../models/pedidos");


const getPedidos = (req, res) => {
  Pedido.find()
    .then(users => {
      if (!users) return res.status(404).send({
        status: "error",
        message: "No se encontraron pedidos"
      });

      return res.status(200).send({
        status: "success",
        users
      });
    })
    .catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al obtener los pedidos"
      })
    })
}

const addPedido = (req, res) => {
  let body = req.body;
  let pedidoToSave = new Pedido(body);
  pedidoToSave.save()
    .then(userSaved => {
      if (!userSaved) return res.status(404).send({
        status: "error",
        message: "No se pudo guardar el pedido"
      })
      return res.status(200).send({
        status: "success",
        userSaved
      })
    })
    .catch(e => {
      // Evita responder 500 por errores esperables (validación / duplicados)
      if (e?.name === 'ValidationError') {
        return res.status(400).send({
          status: 'error',
          message: 'Datos inválidos para crear el usuario',
          details: Object.fromEntries(Object.entries(e.errors || {}).map(([k, v]) => [k, v?.message]))
        });
      }
      // Duplicado por índice unique (por ejemplo id repetido)
      if (e?.code === 11000) {
        return res.status(409).send({
          status: 'error',
          message: 'El usuario ya existe (campo único duplicado)',
          duplicateKey: e?.keyValue || e?.keyPattern
        });
      }
      console.error('Error addUser:', e);
      return res.status(500).send({
        status: "error",
        message: "Error interno al guardar el usuario"
      });
    })

}



const editPedido = (req, res) => {
  const idPedido = req.params.id;
  const { vehicleMake, name, id, telephone, email, orden, EL, plate, mileage, oil, FAire, AComb, FAA, otros, precioTotal } = req.body;

  if (!idPedido) {
    return res.status(400).send({
      status: "error",
      message: "No se proporcionó el id"
    });
  }

  const camposActualizar = { vehicleMake, name, id, telephone, email, orden, EL, plate, mileage, oil, FAire, AComb, FAA, otros, precioTotal };

  Customer.findOneAndUpdate(
    { id: idPedido },
    { $set: camposActualizar },
    { new: true }
  )
    .then(customerUpdated => {
      if (!customerUpdated) return res.status(404).send({
        status: "error",
        message: "No se encontró el cliente"
      });
      return res.status(200).send({
        status: "success",
        customerUpdated
      });
    })
    .catch(err => res.status(500).send({
      status: "error",
      message: err.message
    }));
}

module.exports = {
  getPedidos,
  addPedido,
  editPedido
}
