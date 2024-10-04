const axios = require('axios');
const jwt = require('jsonwebtoken'); // Import jwt
const User = require('../models/AnuUser'); // Correct path to the User model
require('dotenv').config(); // Load environment variables

// Use environment variables
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;
const SENDER_NUMBER = process.env.SENDER_NUMBER;
const DEFAULT_MESSAGE = process.env.DEFAULT_MESSAGE;
const JWT_SECRET = process.env.JWT_SECRET; // Make sure to have a secret key in .env

// Store OTPs temporarily
const otpStore = {}; // In-memory storage for OTPs

// Helper function to generate a 4-digit OTP
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // Generate a random 4-digit number
};

// Define the expiration time (1 hour)
const OTP_EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour in milliseconds

exports.loginUser = async (req, res) => {
    const { number, name, role } = req.body;

    try {
        // Check if the user exists
        let user = await User.findOne({ number });

        // Generate the OTP
        const otp = generateOTP();
        const expirationTime = Date.now() + OTP_EXPIRATION_TIME;

        // Store the OTP with expiration time
        otpStore[number] = { otp, expirationTime };
        console.log(`Stored OTP for ${number}: ${otpStore[number].otp}, expires at: ${new Date(otpStore[number].expirationTime).toISOString()}`);

        // Append the OTP to the predefined message
        const fullMessage = `${DEFAULT_MESSAGE} Your OTP is: ${otp}`;
        const requestPayload = {
            api_key: API_KEY,
            sender: SENDER_NUMBER,
            number,
            message: fullMessage,
        };

        // Send OTP via WhatsApp API
        const response = await axios.post(API_URL, requestPayload, {
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
        });

        // Check if the response indicates a successful message send
        if (response.status !== 200 || !response.data || !response.data.status) {
            console.error(`Failed to send OTP: ${response.status}`, response.data);
            return res.status(response.status).json({
                success: false,
                error: 'Failed to send message',
                details: response.data
            });
        }

        console.log(`Message sent successfully to ${number}`);

        // If user exists, return existing user data
        if (user) {
            // Check if the role matches
            if (user.role !== role) {
                return res.status(400).json({
                    message: "This phone number is already registered as a " + user.role + ". Please use the correct role."
                });
            }

            // Generate JWT token
            const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

            return res.status(200).json({
                message: "OTP sent successfully! Please verify to log in.",
                user: {
                    id: user._id,
                    number: user.number,
                    name: user.name,
                    role: user.role,
                    address: user.address,
                    token, // Return the token in the response
                },
            });
        } else {
            // If user doesn't exist, create a new one
            user = new User({ number, name, role });
            await user.save();

            // Generate JWT token for the new user
            const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

            return res.status(201).json({
                message: "User registered and OTP sent successfully! Please verify to log in.",
                user: {
                    id: user._id,
                    number: user.number,
                    name: user.name,
                    role: user.role,
                    address: user.address,
                    token, // Return the token in the response
                },
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


exports.sendMessage = async (req, res) => {
    const { number } = req.body;

    if (!number) {
        return res.status(400).json({ error: 'Recipient number is required' });
    }

    try {
        // Check if the number exists in the User model
        const user = await User.findOne({ number: number });

        if (!user) {
            return res.status(404).json({ message: 'Phone number not registered' });
        }

        // Generate the OTP
        const otp = generateOTP();
        console.log(`Generated OTP for ${number}: ${otp}`);

        // Calculate the expiration time
        const expirationTime = Date.now() + OTP_EXPIRATION_TIME;

        // Store the OTP with expiration time
        otpStore[number] = { otp, expirationTime };
        console.log(`Stored OTP for ${number}: ${otpStore[number].otp}, expires at: ${new Date(otpStore[number].expirationTime).toISOString()}`);

        // Append the OTP to the predefined message
        const fullMessage = `${DEFAULT_MESSAGE} Your OTP is: ${otp}`;

        const requestPayload = {
            api_key: API_KEY,
            sender: SENDER_NUMBER,
            number,
            message: fullMessage, // Use the full message with the OTP
        };

        // Send OTP via WhatsApp API
        const response = await axios.post(API_URL, requestPayload, {
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
        });

        // Check if the response indicates a successful message send
        if (response.status === 200 && response.data && response.data.status === true) {
            console.log(`Message sent successfully to ${number}`);
            return res.status(200).json({
                success: true,
                message: 'OTP sent successfully',
                data: response.data, // You can remove this in production
                otp: otp // For testing purposes, you can return the OTP in development
            });
        } else {
            console.error(`Failed to send OTP: ${response.status}`, response.data);
            return res.status(response.status).json({
                success: false,
                error: 'Failed to send message',
                details: response.data
            });
        }

    } catch (error) {
        console.error('Error checking phone number or sending OTP:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};

// Function to verify OTP
exports.verifyOTP = async (req, res) => {
    const { otp } = req.body; // Only get OTP from request

    if (!otp) {
        return res.status(400).json({ message: 'OTP is required' });
    }

    try {
        // Retrieve the number from the stored OTP details
        const userEntry = Object.entries(otpStore).find(([key, value]) => value.otp === otp);
        
        if (!userEntry) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const number = userEntry[0]; // Get the phone number from the entry

        // OTP verification successful, clear the OTP from the in-memory store
        delete otpStore[number];
        console.log(`OTP for ${number} cleared from memory after successful verification`);

        // Now retrieve the user from the database
        const user = await User.findOne({ number: number });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user's verified status
        user.verified = true; // Set verified to true
        await user.save(); // Save the changes to the database

        // Return user details upon successful verification
        return res.status(200).json({
            message: 'Phone number verified successfully!',
            user: {
                id: user._id,
                number: user.number,
                name: user.name,
                role: user.role,
                verified: user.verified // Return the updated verified status
            }
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({ message: 'Error verifying OTP', details: error.message });
    }
};



exports.resendOTP = async (req, res) => {
    const { number } = req.body;

    if (!number) {
        return res.status(400).json({ error: 'Recipient number is required' });
    }

    try {
        // Check if the number exists in the User model
        const user = await User.findOne({ number: number });

        if (!user) {
            return res.status(404).json({ message: 'Phone number not registered' });
        }

        // Generate a new OTP
        const otp = generateOTP();
        console.log(`Generated OTP for ${number}: ${otp}`);

        // Calculate the new expiration time
        const expirationTime = Date.now() + OTP_EXPIRATION_TIME;

        // Update the OTP in the store (overwrite the previous OTP)
        otpStore[number] = { otp, expirationTime };
        console.log(`Stored new OTP for ${number}: ${otpStore[number].otp}, expires at: ${new Date(otpStore[number].expirationTime).toISOString()}`);

        // Append the OTP to the predefined message
        const fullMessage = `${DEFAULT_MESSAGE} Your new OTP is: ${otp}`;

        const requestPayload = {
            api_key: API_KEY,
            sender: SENDER_NUMBER,
            number,
            message: fullMessage,
        };

        // Send OTP via WhatsApp API
        const response = await axios.post(API_URL, requestPayload, {
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
        });

        // Check if the response indicates a successful message send
        if (response.status === 200 && response.data && response.data.status === true) {
            console.log(`Message sent successfully to ${number}`);
            return res.status(200).json({
                success: true,
                message: 'OTP resent successfully',
                data: response.data,
                otp: otp // For testing purposes, you can return the OTP in development
            });
        } else {
            console.error(`Failed to resend OTP: ${response.status}`, response.data);
            return res.status(response.status).json({
                success: false,
                error: 'Failed to resend message',
                details: response.data
            });
        }

    } catch (error) {
        console.error('Error checking phone number or resending OTP:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};
