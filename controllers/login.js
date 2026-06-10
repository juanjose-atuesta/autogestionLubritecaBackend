const Login = require("../models/login");
const validateLogin = (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  try {
    const login = Login.findOne({ username: username, password: password });
    if (!login) {
      return res.status(404).send({
        status: false,
        message: "No se encontro el cliente"
      });

    }
    return res.status(200).send({
      status: true,
      message: "Login exitoso"
    })
  } catch (e) {
    return res.status(500).send({ status: false, message: "Error en el servidor" });
  }
}
module.exports = { validateLogin }
