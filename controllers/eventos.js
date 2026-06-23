const Event = require("../models/eventos.js");

const getValue = async (req, res) => {
  try {
    const evento = await Event.findOne({ id: "1" })
    return res.status(200).send({
      valor: evento.value
    })
  } catch (e) {
    return res.status(500).send({})
  }
}

const changeValue = async (req, res) => {
  try {
    const evento = await Event.findOne({ id: "1" })
    evento.value += 1

    return res.status(200).send({
      status: "succes"
    })
  } catch (e) {
    return res.status(500).send({})
  }

}

module.exports = {
  getValue,
  changeValue
}
