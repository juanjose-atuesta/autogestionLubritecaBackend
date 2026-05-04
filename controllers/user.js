const User = require("../models/user");

const getUsers = (req, res) => {
  User.find()
    .then(users => {
      if (!users) return res.status(404).send({
        status: "error",
        message: "No se encontraron usuarios"
      });

      return res.status(200).send({
        status: "success",
        users
      });
    })
    .catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al obtener los usuarios"
      })
    })
}




module.exports = {
  getUsers
}
