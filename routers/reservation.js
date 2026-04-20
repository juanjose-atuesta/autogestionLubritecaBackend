const ReservationController = require("../controllers/reservation");
const express = require("express");
const router = express.Router();

//GET 
router.get("/reservationsList", ReservationController.reservationsList);

//POST
router.post("/saveReservation", ReservationController.saveReservation);

//DELETE
router.delete("/deleteReservation/:id", ReservationController.deleteReservation);

module.exports = router;
