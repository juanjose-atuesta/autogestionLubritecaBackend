const Reservation = require("../models/reservation");

const saveReservation = (req, res) => {
  let body = req.body;
  let reservationToSave = new Reservation(body);
  reservationToSave.save()
    .then(reservationSaved => {
      if (!reservationSaved) return res.status(404).send({
        status: "error",
        message: "No se pudo guardar la reserva"
      })
      return res.status(200).send({
        status: "success",
        reservationSaved
      });

    }).catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al guardar la reserva"
      });
    })
}

const reservationsList = (req, res) => {
  Reservation.find()
    .then(reservationList => {
      if (!reservationList) return res.status(404).send({
        status: "error",
        message: "No se encontraron reservas"
      });
      return res.status(200).send({
        status: "success",
        reservationList
      })
    }).catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al obtener las reservas"
      })
    })
}

const deleteReservation = (req, res) => {
  let id = req.params.id;
  Reservation.findOneAndDelete({ reservationId: id })
    .then(reservationDeleted => {
      if (!reservationDeleted) return res.status(404).send({
        status: "error",
        message: "No se encontro la reserva"
      });
      return res.status(200).send({
        status: "success",
        reservationDeleted
      });
    }).catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al eliminar la reserva"
      });
    })
}

const editReservation = (req, res) => {
  const reservationId = req.params.id;
  const { name, telephone, plate, service, space, date, hour, notes } = req.body;

  if (!reservationId) {
    return res.status(400).send({
      status: "error",
      message: "No se proporcionó el id"
    });
  }

  const camposActualizar = { name, telephone, plate, service, space, date, hour, notes };
  Reservation.findOneAndUpdate(
    { reservationId: reservationId },
    { $set: camposActualizar },
    { new: true }
  )
    .then(reservationUpdated => {
      if (!reservationUpdated) return res.status(404).send({
        status: "error",
        message: "No se encontró el cliente"
      });
      return res.status(200).send({
        status: "success",
        reservationUpdated
      });
    })
    .catch(err => res.status(500).send({
      status: "error",
      message: err.message
    }));
}

module.exports = {
  saveReservation,
  reservationsList,
  deleteReservation,
  editReservation
}
