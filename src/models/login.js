const { Schema, model } = require('mongoose');
const LoginSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    require: true,
    default: "worker"
  }
})

module.exports = model("Login", LoginSchema, "login")
