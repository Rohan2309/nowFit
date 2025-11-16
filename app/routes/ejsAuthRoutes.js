
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
router.get('/register', AuthController.showRegister);
router.post('/register', AuthController.register);
router.get('/verify', (req,res)=> res.render('auth/verify'));
router.post('/verify', AuthController.verifyOtp);
router.get('/login', AuthController.showLogin);
router.post('/login', AuthController.login);
router.get('/logout', AuthController.logout);
module.exports = router;
