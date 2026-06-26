const { Schema, model } = require('mongoose');
const LoginAdminSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

module.exports = model("LoginAdmin", LoginAdminSchema, "loginAdmin")
