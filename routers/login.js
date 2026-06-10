const express = require('express');
const router = express.Router();

const LoginController = require("../controllers/login");

//POST
router.post("/validateLogin", LoginController.validateLogin);

module.exports = router
