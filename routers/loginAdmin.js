const express = require('express');
const router = express.Router();
const LoginAdminController = require('../controllers/loginAdmin');

router.post("/validateLoginAdmin", LoginAdminController.validateLoginAdmin);

module.exports = router;
