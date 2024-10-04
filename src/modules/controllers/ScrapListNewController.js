// controllers/scrapController.js
const Scrap = require('../models/ScrapListNew');

// Add new scrap items
exports.addScrap = async (req, res) => {
    try {
        const scrapData = req.body; // Get data from request body
        if (!Array.isArray(scrapData)) {
            return res.status(400).json({ message: 'Invalid data format. Expected an array of scrap items.' });
        }
        const newScraps = await Scrap.insertMany(scrapData);
        res.status(201).json({ message: 'Scrap data added successfully!', data: newScraps });
    } catch (error) {
        console.error('Error adding scrap data:', error);
        res.status(500).json({ message: 'Error adding scrap data', error: error.message });
    }
};

// Get all scrap items
exports.getAllScrap = async (req, res) => {
    try {
        const scraps = await Scrap.find();
        res.status(200).json({ message: 'Scrap items fetched successfully', data: scraps });
    } catch (error) {
        console.error('Error fetching scraps:', error);
        res.status(500).json({ message: 'Error fetching scrap items', error: error.message });
    }
};
