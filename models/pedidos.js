const { Schema, model } = require('mongoose');
const UserSchema = new Schema({
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
  cant: {
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

  }




})
