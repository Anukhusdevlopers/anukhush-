// routes/scrapRoutes.js
const express = require('express');
const router = express.Router();
const { addScrap, getAllScrap } = require('../controllers/ScrapListNewController');

// Route to add a new scrap item
router.post('/scraplist', addScrap);

// Route to get all scrap items
router.get('/scraplist', getAllScrap);

module.exports = router;
