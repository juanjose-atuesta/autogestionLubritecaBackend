const express = require('express');
const router = express.Router();

const UserController = require("../controllers/user");

//GET 
router.get("/usersList", UserController.getUsers);
router.get("/recommendedUsers/:id", UserController.getRecommendedUsers);
router.get("/usersNotContacted", UserController.getUsersNotContacted);
router.get("/getRecommendedMe/:id", UserController.getRecommendedMe);
//POST 
router.post("/addUser", UserController.addUser);
//DELETE 
router.delete("/deleteUser/:id", UserController.deleteUser);

//PATH 
router.patch("/addRecommendedMe/:id", UserController.addRecommendedMe);
//router.patch("/updatePoints/:id", UserController.updatePoints);
router.patch("/addRecommendedUser/:id", UserController.addRecommendedUser);
router.patch("/editUser/:id", UserController.editUser);
router.patch("/setRecommended/:id", UserController.setRecommended);
router.patch("/addHighBuy/:id", UserController.addHighBuy);
router.patch("/addFrecuentBuy/:id", UserController.addFrecuentBuy);


module.exports = router
