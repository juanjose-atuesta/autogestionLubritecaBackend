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
  }
})

module.exports = model("Login", LoginSchema, "login")
