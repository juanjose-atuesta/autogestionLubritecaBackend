
const { Schema, model } = require('mongoose');
const EventoSchema = new Schema({
  value: {
    type: Numeric,
    required: true
  },
  id: {
    type: String,
    required: true,
    default: "1"
  }
});

module.exports = model("Evento", EventoSchema, "eventos");
