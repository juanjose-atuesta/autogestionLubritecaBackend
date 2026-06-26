const LoginAdmin = require("../models/loginAdmin");

const validateLoginAdmin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const login = await LoginAdmin.findOne({ username, password });
    if (!login) {
      return res.status(404).send({ status: false, message: "No se encontró el admin" });
    }
    return res.status(200).send({ status: true, message: "Login admin exitoso" });
  } catch (e) {
    return res.status(500).send({ status: false, message: "Error en el servidor" });
  }
};

module.exports = { validateLoginAdmin }
