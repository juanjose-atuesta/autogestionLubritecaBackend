const express = require('express');
const router = express.Router();

const UserController = require("../controllers/user");

//GET 
router.get("/usersList", UserController.getUsers);


module.exports = router;
