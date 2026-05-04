//importamos las dependencias 

const express = require('express');
const cors = require('cors');

//creamos el servidor 
const app = express();
//declaramos el puerto
const PORT = 3000;

//coneccion a la base de datos 
const connection = require("./database/connection");
connection();

//configuracion de middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extenden: true }));



//cargar rutas 
app.use("/api/customers", require("./routers/customer"));
app.use("/api/historial", require("./routers/historialDB"));
app.use("/api/reservations", require("./routers/reservation"));
app.use("/api/users", require("./routers/user"));

//Endpoint de prueba
app.get('/', (req, res) => {
  console.log('Recibida una solicitud GET en /');
  return res.status(200).send('Bienvenido a mi API');
});

//iniciamos el servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor iniciado correctamente usando el puerto: " + PORT);
});
