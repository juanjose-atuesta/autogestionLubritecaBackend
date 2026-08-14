const express = require('express');
const router = express.Router();

const EventController = require("../controllers/eventos");


//GET 
router.get("/getValue", EventController.getValue);

//PATCH 
router.patch("/changeValue", EventController.changeValue);

module.exports = router
