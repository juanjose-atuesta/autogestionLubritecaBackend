const Login = require("../models/login");
const validateLogin = async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  try {
    const login = await Login.findOne({ username: username, password: password });
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
// En login.js (controlador) — agrega esto
const addLogin = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send({ status: false, message: 'Faltan campos' });
  }
  try {
    const existe = await Login.findOne({ username });
    if (existe) {
      return res.status(409).send({ status: false, message: 'El usuario ya existe' });
    }
    const nuevo = new Login({ username, password });
    await nuevo.save();
    return res.status(200).send({ status: true, message: 'Usuario creado' });
  } catch (e) {
    return res.status(500).send({ status: false, message: 'Error en el servidor' });
  }
};

module.exports = { validateLogin, addLogin }
