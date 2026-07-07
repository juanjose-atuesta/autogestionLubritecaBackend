const Customer = require("../models/customer");

// En pedidos.controller.js
const { notificar } = require('../utils/sse');
//Creamos los metodos


const getCustomers = (req, res) => {
  Customer.find()
    .then(customers => {
      if (!customers) return res.status(404).send({
        status: "error",
        message: "No se encontraron clientes"
      });


      return res.status(200).send({
        status: "success",
        customers
      });

    })
    .catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al obtener los clientes"
      });
    });
}

const getCustomersPrincipalPanel = (req, res) => {
  Customer.find({ wasContacted: false })
    .then(customers => {
      if (!customers) return res.status(404).send({
        status: "error",
        message: "No se encontraron clientes"
      });


      return res.status(200).send({
        status: "success",
        customers
      });

    })
    .catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al obtener los clientes"
      });
    });
}

const addCustomer = (req, res) => {
  let body = req.body;
  let clienteToSave = new Customer(body);
  clienteToSave.save()
    .then(clienteSaved => {
      if (!clienteSaved) return res.status(404).send({
        status: "error",
        message: "No se pudo guardar el cliente"
      })
      notificar('cliente-creado', { id: clienteToSave._id })
      return res.status(200).send({
        status: "success",
        clienteSaved
      });
    })
    .catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al guardar el cliente"
      });
    })
}

const listCustomersContacted = (req, res) => {
  Customer.find({ wasContacted: true })
    .then(customer => {
      if (!customer) return res.status(404).send({
        status: "error",
        message: "No se encontro el cliente"
      });
      return res.status(200).send({
        status: "success",
        customerList: customer
      });
    })
    .catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al obtener el cliente"
      });
    });
}

const editCustomer = (req, res) => {
  const id = req.params.id;
  const { name, telephone, plate, service, entryDate, nextContact, mileage } = req.body;

  if (!id) {
    return res.status(400).send({
      status: "error",
      message: "No se proporcionó el id"
    });
  }

  const camposActualizar = { name, telephone, plate, service, entryDate, nextContact, mileage };

  Customer.findOneAndUpdate(
    { id: id },
    { $set: camposActualizar },
    { new: true }
  )
    .then(customerUpdated => {
      if (!customerUpdated) return res.status(404).send({
        status: "error",
        message: "No se encontró el cliente"
      });
      notificar('cliente-editado', { id: customerUpdated._id })
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


const toggleWasContacted = async (req, res) => {
  const id = req.params.id;
  try {
    const customer = await Customer.findOne({ id: id });
    if (!customer) {
      return res.status(404).send({
        status: "error",
        message: "No se encontro el cliente"
      });
    }
    // Cambia el valor al contrario
    customer.wasContacted = !customer.wasContacted;
    await customer.save();
    res.status(200).send({
      status: "success",
      customerUpdated: customer
    });

    // Notificar después de responder, con un pequeño delay
    setTimeout(() => {
      notificar('cliente-editado', { id: customer._id });
    }, 100);
  } catch (e) {
    return res.status(500).send({
      status: "error",
      message: "Error al actualizar el cliente"
    });
  }
}


const deleteCustomer = (req, res) => {
  let id = req.params.id;
  Customer.findOneAndDelete({ id: id })
    .then(customerDeleted => {
      if (!customerDeleted) return res.status(404).send({
        status: "error",
        message: "No se encontro el cliente"
      });
      notificar('cliente-eliminado', { id: customerDeleted._id });
      return res.status(200).send({
        status: "success",
        customerDeleted
      });
    }).catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al eliminar el cliente"
      });
    })
}
module.exports = {
  getCustomers, addCustomer, listCustomersContacted, editCustomer, toggleWasContacted, deleteCustomer, getCustomersPrincipalPanel
};
