const express = require('express');
const router = express.Router();

const HistorialDBController = require('../controllers/historialDB');

//POST
router.post("/saveToHistorialDB", HistorialDBController.saveToHistorialDB);

//GET
router.get("/historialDBList", HistorialDBController.historialDBList);
router.get("/historialListCustomersContacted", HistorialDBController.histrialLististCustomersContacted);

//PATCH
router.patch("/toggleWasContacted/:id", HistorialDBController.toggleWasContacted);
router.patch("/editHistorialDBCustomer/:id", HistorialDBController.editHistorialDBCustomer);
module.exports = router;
