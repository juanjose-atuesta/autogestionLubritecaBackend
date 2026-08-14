const { Schema, model } = require('mongoose');

const PedidosSchema = new Schema({
  vehicleMake: {
    type: String,
    default: "",
    required: true
  },
  name: {
    type: String,
    default: "",
    required: true
  },
  id: {
    type: String,
    default: "",
    required: true
  },
  telephone: {
    type: String,
    default: "",
    required: true
  },
  email: {
    type: String,
    default: ""
  },
  orden: {
    type: String,
    default: "",
    required: true
  },
  EL: {
    type: String,
    default: ""
  },
  plate: {
    type: String,
    default: "",
    required: true
  },
  mileage: {
    type: String,
    default: "",
    required: true
  },
  // Cada item de estos arreglos es: [cantidad(Number), referencia(String), precioUnitario(Number)]
  oil: {
    type: Array,
    default: [],
  },
  FAire: {
    type: Array,
    default: [],
  },
  FComb: {
    type: Array,
    default: [],
  },
  FAA: {
    type: Array,
    default: []
  },
  // otros es una lista de filas dinámicas, cada una [cantidad, referencia, precioUnitario]
  otros: {
    type: Array,
    default: [],
  },
  precioTotal: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = model("Pedido", PedidosSchema, "pedidos");
