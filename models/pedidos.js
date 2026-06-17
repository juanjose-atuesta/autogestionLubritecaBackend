const { Schema, model } = require('mongoose');
const PedidosSchema = new Schema({
  vehicleMake: {
    type: String,
    default: "",
    require: true
  },
  name: {
    type: String,
    default: "",
    require: true
  },
  id: {
    type: String,
    default: "",
    require: true
  },
  telephone: {
    type: String,
    default: "",
    require: true
  },
  email: {
    type: String,
    default: "",
    require: true

  },

  orden: {
    type: String,
    default: "",
    require: true
  },
  EL: {

    type: String,
    default: "",
    require: true
  },

  plate: {
    type: String,
    default: "",
    require: true

  },
  mileage: {
    type: String,
    default: "",
    require: true

  },
  oil: {
    type: Array,
    require: true,
    default: [],

  },
  FAire: {
    type: Array,
    require: true,
    default: [],
  },
  FComb: {
    type: Array,
    require: true,
    default: [],
  },
  FAA: {
    type: Array,
    require: true,
    default: []
  },
  otros: {
    type: Array,
    require: true,
    default: [],
  },
  precioTotal: {
    type: Number,
    require: true,
    default: 0
  }




})

module.exports = model("Pedido", PedidosSchema, "pedidos");
