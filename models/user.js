const { Schema, model } = require('mongoose');
const UserSchema = new Schema({

  name: {
    type: String,
    required: true,
    uppercase: true,
  },
  telephone: {
    type: String,
    required: true,

  },
  registrationDay: {
    type: String,
    default: Date.year + '-' + (Date.month + 1) + '-' + Date.day
  },
  recommendedUsers: {
    type: Array,
    default: []
  },
  acommulatedPoints: {
    type: Number,
    default: 0
  }

})

module.exports = model("User", UserSchema, "users")
