
const { Schema, model } = require('mongoose');
const EventoSchema = new Schema({
  value: {
    type: Number,
    required: true
  },
  id: {
    type: String,
    required: true
  }
});

module.exports = model("Evento", EventoSchema, "eventos");
