const Reservation = require("../models/reservation");

const { notificar } = require('../../utils/sse');
const saveReservation = (req, res) => {
  let body = req.body;
  let reservationToSave = new Reservation(body);
  reservationToSave.save()
    .then(reservationSaved => {
      if (!reservationSaved) return res.status(404).send({
        status: "error",
        message: "No se pudo guardar la reserva"
      })
      res.status(200).send({
        status: "success",
        reservationSaved
      });

      notificar('reserva-agregada', { id: reservationSaved.reservationId, reserva: reservationSaved });


    }).catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al guardar la reserva"
      });
    })
}

const reservationsList = (req, res) => {
  Reservation.find({ wasConcluded: false })
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

const reservationsListAll = (req, res) => {
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
      res.status(200).send({
        status: "success",
        reservationDeleted
      });
      notificar("reserva-eliminada", { id: reservationDeleted.reservationId, reserva: reservationDeleted });

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
      res.status(200).send({
        status: "success",
        reservationUpdated
      });
      notificar("reserva-editada", { id: reservationUpdated.reservationId, reserva: reservationUpdated });
    })
    .catch(err => res.status(500).send({
      status: "error",
      message: err.message
    }));
}
const toggleWasConcluded = async (req, res) => {
  const reservationId = req.params.id;
  try {
    const reservation = await Reservation.findOne({ reservationId: reservationId });
    if (!reservation) {
      return res.status(404).send({
        status: "error",
        message: "No se encontro la cita"
      });
    }
    reservation.wasConcluded = true;
    await reservation.save();
    res.status(200).send({
      status: "succes",
      reservation: reservation
    })

    notificar('reservacion-concluida', { id: reservation.reservationId, reserva: reservation });
  }
  catch (e) {
    return res.status(500).send({
      status: "error",
      message: "Error al actualizar el cliente"
    });
  }
}

const getReservationsConcluded = async (req, res) => {
  Reservation.find({ wasConcluded: true })
    .then(reservations => {
      if (!reservations) return res.status(404).send({
        status: "error",
        message: "No se encontraron clientes"
      });


      res.status(200).send({
        status: "success",
        reservations
      });

    })
    .catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al obtener los clientes"
      });
    });

}
module.exports = {
  saveReservation,
  reservationsList,
  reservationsListAll,
  deleteReservation,
  editReservation,
  toggleWasConcluded,
  getReservationsConcluded
}
