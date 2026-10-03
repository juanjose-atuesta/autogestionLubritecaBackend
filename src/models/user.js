const { Schema, model } = require('mongoose');
const UserSchema = new Schema({

  name: {
    type: String,
    required: true,
    uppercase: true,
  },
  // La cedula es el identificador principal, pero puede guardarse como "."
  // cuando el cliente no quiere darlo: la unicidad se valida en el controller.
  id: {
    type: String,
    required: true
  },
  telephone: {
    type: String,
    required: true,

  },
  registrationDay: {
    type: String,
    default: ""
  },
  recommendedUsers: {
    type: Array,
    default: []
  },
  highBuy: {
    type: Array,
    default: []
  },
  frecuentBuy: {
    type: Array,
    default: []
  },
  pointsByRecommendation: {
    type: Number,
    default: 0
  },
  pointsByFrecuentBuy: {
    type: Number,
    default: 0
  },
  pointsByHighBuy: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  wasContacted: {
    type: Boolean,
    default: false
  },
  recommendedMe: {
    type: String,
    default: ""
  },
  email: {
    type: String,
    default: ""
  }


})

module.exports = model("User", UserSchema, "users")
