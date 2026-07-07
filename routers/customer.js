//crear express 
const express = require('express');
const router = express.Router();

//Cargar controlador 

const CustomerController = require("../controllers/customer");

//Crear rutas
//GET 
router.get("/customersList", CustomerController.getCustomers);
router.get("/listCustomersContacted", CustomerController.listCustomersContacted);
router.get("/customersListPanelPrincipal", CustomerController.getCustomersPrincipalPanel);

//POST
router.post("/addCustomer", CustomerController.addCustomer);

//PUT 

//PATCH 
router.patch("/toogleWasContacted/:id", CustomerController.toggleWasContacted);

router.patch("/editCustomer/:id", CustomerController.editCustomer);

//DELETE 

router.delete("/deleteCustomer/:id", CustomerController.deleteCustomer);
//Exportar router
module.exports = router;
