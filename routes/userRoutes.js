const express = require("express")
const router = express.Router()
const fileUpload = require("express-fileupload")

// Middlewares
const isAuthenticated = require("../middlewares/isAuthenticated")
const validateEmail = require("../middlewares/validateEmail")
const isAdminOrCoach = require("../middlewares/isAdminOrCoach")

// Controller
const userController = require("../controllers/userController")

// ----------- SIGNUP -----------
router.post("/signup", validateEmail, userController.signup)

// ----------- SIGNUP WITH JOIN CODE -----------
router.post("/signup/:code", validateEmail, userController.signupWithCode)

// ----------- LOGIN -----------
router.post("/login", validateEmail, userController.login)

// ----------- GET ALL USERS -----------
router.get("/users", userController.getUsers)

// ----------- GET USER BY ID -----------
router.get("/user/:id", userController.getUserById)

// ----------- UPDATE USER PROFILE -----------
router.patch(
  "/update-user/:id",
  fileUpload(),
  isAuthenticated,
  userController.updateUser
)

// ----------- UPDATE USER CLUB OR TEAM -----------
router.patch(
  "/coach/update-user/:id",
  isAuthenticated,
  isAdminOrCoach,
  userController.updateUserTeam
)

// ----------- DELETE USER -----------
router.delete("/delete-user/:id", isAuthenticated, userController.deleteUser)

module.exports = router
