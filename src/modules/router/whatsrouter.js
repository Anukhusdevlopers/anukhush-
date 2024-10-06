// src/routes/messageRoutes.js
const express = require('express');
const sendMessage  = require('../controllers/whatsaap');

const router = express.Router();

// Define the route for sending messages
router.post('/send-message/api',sendMessage. sendMessage);
router.post('/verify-otp/api',sendMessage.verifyOTP);
router.post('/resend-otp/api', sendMessage.resendOTP); // Add this line
router.post('/login/api',sendMessage.loginUser);


router.put('/edit-profile/api',sendMessage. editProfile);

router.get('/user-profile',sendMessage. getProfile); // GET request to get profile details
router.put('/update-address', sendMessage. updateAddress);

module.exports = router;
