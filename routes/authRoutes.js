const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");


// Register
router.post("/register", authController.register);


// Login
router.post("/login", authController.login);


// Forgot Password
router.post("/forgot-password", authController.forgotPassword);


// Reset Password
router.post("/reset-password/:token", authController.resetPassword);


module.exports = router;
