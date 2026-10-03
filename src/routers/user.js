const express = require('express');
const router = express.Router();

const UserController = require("../controllers/user");

// Toda ruta por cedula pasa por identificarUsuario: exige que exista un solo
// usuario con esa cedula (y que el telefono enviado coincida, si viene).
//GET 
router.get("/usersList", UserController.getUsers);
router.get("/recommendedUsers/:id", UserController.identificarUsuario, UserController.getRecommendedUsers);
router.get("/usersNotContacted", UserController.getUsersNotContacted);
router.get("/getRecommendedMe/:id", UserController.identificarUsuario, UserController.getRecommendedMe);
router.get('/availableToRecommend/:id', UserController.identificarUsuario, UserController.getAvailableUsersToRecommend);
//POST 
router.post("/addUser", UserController.addUser);
//DELETE 
router.delete("/deleteUser/:id", UserController.identificarUsuario, UserController.deleteUser);

//PATH 
router.patch("/addRecommendedMe/:id", UserController.identificarUsuario, UserController.addRecommendedMe);
//router.patch("/updatePoints/:id", UserController.updatePoints);
router.patch("/addRecommendedUser/:id", UserController.identificarUsuario, UserController.addRecommendedUser);
router.patch("/editUser/:id", UserController.identificarUsuario, UserController.editUser);
router.patch("/setRecommended/:id", UserController.identificarUsuario, UserController.setRecommended);
router.patch("/addHighBuy/:id", UserController.identificarUsuario, UserController.addHighBuy);
router.patch("/addFrecuentBuy/:id", UserController.identificarUsuario, UserController.addFrecuentBuy);
router.get('/rankingUsuarios', UserController.getRankingUsuarios);
router.patch('/editPoints/:id', UserController.identificarUsuario, UserController.editPoints);

module.exports = router
