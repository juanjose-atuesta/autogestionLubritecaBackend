const Customer = require("../models/customer");

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
const addCustomer = (req, res) => {
  let body = req.body;
  let clienteToSave = new Customer(body);
  clienteToSave.save()
    .then(clienteSaved => {
      if (!clienteSaved) return res.status(404).send({
        status: "error",
        message: "No se pudo guardar el cliente"
      })
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

const listByPlate = (req, res) => {
  let plate = req.params.plate;
  Customer.find({ plate: plate })
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

const listByName = (req, res) => {
  let name = req.params.name;
  Customer.find({ name: { $regex: name, $options: `i` } })
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
const listByTelephone = (req, res) => {
  let telephone = req.params.telephone;
  Customer.find({ telephone: { $regex: telephone, $options: `i` } })
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

const listByService = (req, res) => {
  let service = req.params.service;
  Customer.find({ service: { $regex: service, $options: `i` } })
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
  let body = req.body;
  if (!body || !body.id) {
    return res.status(404).send({
      status: "error",
      message: "No se encontro nada"
    });

  }
  Customer.findOneAndUpdate({ id: body.id }, body, { new: true })
    .then(customerUpdated => {
      if (!customerUpdated) return res.status(404).send({
        status: "error",
        message: "No se encontro el cliente"
      });
      return res.status(200).send({
        status: "success",
        customerUpdated
      });

    })
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
    return res.status(200).send({
      status: "success",
      customerUpdated: customer
    });
  } catch (e) {
    return res.status(500).send({
      status: "error",
      message: "Error al actualizar el cliente"
    });
  }
}
module.exports = { getCustomers, addCustomer, listByPlate, listByName, listByTelephone, listByService, listCustomersContacted, editCustomer, toggleWasContacted };
