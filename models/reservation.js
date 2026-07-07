const { Schema, model } = require('mongoose');

//creamos el esquema
const ReservationSchema = new Schema({
  name: {
    type: String,
    required: true,
    uppercase: true
  },
  customerId: {
    type: String,
    required: true
  },
  telephone: {
    type: String,
    required: true,

  },
  plate: {
    type: String,
    required: true,
    uppercase: true,
  },
  service: {
    type: String,
    required: true,
  },
  reservationId: {
    type: String,
    required: true
  },
  space: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  hour: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  wasConcluded: {
    type: Boolean,
    default: false
  }


})

//exportamos el modelo 
module.exports = model('Reservation', ReservationSchema, "reservations");
