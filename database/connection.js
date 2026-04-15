const mongoose = require('mongoose');
const connection = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/autogestionLubritecaDB");
    console.log("Conexión a la base de datos establecida correctamente");
  } catch (error) {
    console.error("Error al conectar a la base de datos: ", error);
    throw new Error("Error al conectar a la base de datos");
  }
}

module.exports = connection;
