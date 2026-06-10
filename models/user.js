const { Schema, model } = require('mongoose');
const UserSchema = new Schema({

  name: {
    type: String,
    required: true,
    uppercase: true,
  },
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
  pointsByRecommendation: {
    type: Number,
    default: 0
  },
  pointsByFrecuentBuy: {
    type: Number,
    default: 0
  },
  pointsByHightBuy: {
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
  }
})

module.exports = model("User", UserSchema, "users")
