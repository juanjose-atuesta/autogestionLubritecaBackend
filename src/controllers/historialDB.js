const HistorialDB = require('../models/historialDB');
const { notificar } = require('../../utils/sse');

const saveToHistorialDB = (req, res) => {
  let body = req.body;
  let historialDBToSave = new HistorialDB(body);
  historialDBToSave.save()
    .then(historialDBSaved => {
      if (!historialDBSaved) return res.status(404).send({
        status: "error",
        message: "No se pudo guardar el historialDB"
      });
      res.status(200).send({
        status: "success",
        historialDBSaved
      });
      notificar('historial-guardado', { id: historialDBSaved._id });
    }).catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al guardar el historialDB"
      });
    });
}

const historialDBList = (req, res) => {
  HistorialDB.find()
    .then(historialDBList => {
      if (!historialDBList) return res.status(404).send({
        status: "error",
        message: "No se encontraron historialesDB"
      });
      return res.status(200).send({
        status: "success",
        historialDBList
      });
    }).catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al obtener los historialesDB"
      })
    })
}

const toggleWasContacted = async (req, res) => {
  const id = req.params.id;
  try {
    const customer = await HistorialDB.findOne({ id: id });
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

const histrialLististCustomersContacted = (req, res) => {
  HistorialDB.find({ wasContacted: true })
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

const editHistorialDBCustomer = (req, res) => {
  const id = req.params.id;
  const { name, telephone, plate, service, entryDate, nextContact, mileage } = req.body;

  if (!id) {
    return res.status(400).send({
      status: "error",
      message: "No se proporcionó el id"
    });
  }

  const camposActualizar = { name, telephone, plate, service, entryDate, nextContact, mileage };

  HistorialDB.findOneAndUpdate(
    { id: id },
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
  saveToHistorialDB,
  historialDBList,
  toggleWasContacted,
  histrialLististCustomersContacted,
  editHistorialDBCustomer
}
