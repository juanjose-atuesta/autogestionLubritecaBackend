const Evento = require("../models/eventos");

const getValue = async (req, res) => {
  try {
    const evento = await Evento.findOne({ id: "1" })
    if (!evento) {
      return res.status(404).send({
        status: "fuck"
      })
    }
    return res.status(200).send({
      valor: evento
    })
  } catch (e) {
    return res.status(500).send({})
  }
}
const changeValue = async (req, res) => {
  try {
    const evento = await Evento.findOne({ id: "1" });

    if (!evento) {
      return res.status(404).send({
        status: "error",
        message: "Evento no encontrado"
      });
    }

    evento.value += 1;

    await evento.save();

    return res.status(200).send({
      status: "success"
    });

  } catch (e) {
    console.error(e);

    return res.status(500).send({});
  }
};

module.exports = {
  getValue,
  changeValue
}
