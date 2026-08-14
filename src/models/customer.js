//importamos la libreria moongose 

const { Schema, model } = require('mongoose');

//creamos el esquema 
const CustomerSchema = new Schema({
  name: {
    type: String,
    required: true,
    uppercase: true,
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
  wasContacted: {
    type: Boolean,
    default: false
  },
  entryDate: {
    type: String,
    default: Date.year + '-' + (Date.month + 1) + '-' + Date.day,
  },
  nextContact: {
    type: String,
    default: "undefined",
    required: true
  },
  mileage: {
    type: String,
    required: true
  },
  service: {
    type: String,
    default: ""
  },
  createAt: {
    type: String,
  },
  updateAt: {
    type: String,
    default: "undefined"
  },
  id: {
    type: String,
    default: Date.now
  },
  reservationConcluded: {
    type: Boolean,
    default: false
  }
});

//exportamos el modelo
module.exports = model("Customer", CustomerSchema, "customers");
