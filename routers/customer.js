//crear express 
const express = require('express');
const router = express.Router();

//Cargar controlador 

const CustomerController = require("../controllers/customer");

//Crear rutas
//GET 
router.get("/customersList", CustomerController.getCustomers);
router.get("/listByPlate/:plate", CustomerController.listByPlate);
router.get("/listByName/:name", CustomerController.listByName);
router.get("/listByTelephone/:telephone", CustomerController.listByTelephone);
router.get("/listByService/:service", CustomerController.listByService);
router.get("/listCustomersContacted", CustomerController.listCustomersContacted);


//POST
router.post("/addCustomer", CustomerController.addCustomer);

//Exportar router
module.exports = router;
