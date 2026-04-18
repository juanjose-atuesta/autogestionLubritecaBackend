const HistorialDB = require('../models/historialDB');

const saveToHistorialDB = (req, res) => {
  let body = req.body;
  let historialDBToSave = new HistorialDB(body);
  historialDBToSave.save()
    .then(historialDBSaved => {
      if (!historialDBSaved) return res.status(404).send({
        status: "error",
        message: "No se pudo guardar el historialDB"
      });
      return res.status(200).send({
        status: "success",
        historialDBSaved
      });
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

module.exports = {
  saveToHistorialDB,
  historialDBList
}
