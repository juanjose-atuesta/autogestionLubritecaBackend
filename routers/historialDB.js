const express = require('express');
const router = express.Router();

const HistorialDBController = require('../controllers/historialDB');

router.post("/saveToHistorialDB", HistorialDBController.saveToHistorialDB);
router.get("/historialDBList", HistorialDBController.historialDBList);
module.exports = router;

