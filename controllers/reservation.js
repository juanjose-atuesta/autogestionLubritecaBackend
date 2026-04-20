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
module.exports = {
  saveReservation,
  reservationsList,
  deleteReservation
}
