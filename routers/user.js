const express = require('express');
const router = express.Router();

const UserController = require("../controllers/user");

//GET 
router.get("/usersList", UserController.getUsers);
router.get("/recommendedUsers/:id", UserController.getRecommendedUsers);
//POST 
router.post("/addUser", UserController.addUser);
//DELETE 
router.delete("/deleteUser/:id", UserController.deleteUser);

//PATH 
router.patch("/updatePoints/:id", UserController.updatePoints);
router.patch("/addRecommendedUser/:id", UserController.addRecommendedUser);
router.patch("/editUser/:id", UserController.editUser);
module.exports = router
