// controllers/scrapItemController.js
const ScrapItem = require('../models/Scraplist'); // Ensure the correct model name

// Create Scrap Item
const { v4: uuidv4 } = require('uuid'); // Import the uuid library

const createScrapItem = async (req, res) => {
  try {
    console.log("Authorization Header:", req.headers.authorization);

    const authToken = req.headers.authToken || req.headers.authorization?.split(" ")[1];

    if (!authToken) {
      return res.status(401).json({ message: "Authorization token is required." });
    }

    const { scrapItems, name, pickUpDate, pickUpTime, location, latitude, longitude } = req.body;

    let parsedScrapItems;
    try {
      parsedScrapItems = JSON.parse(scrapItems); 
    } catch (err) {
      return res.status(400).json({ message: "Invalid scrapItems format", error: err.message });
    }

    // Get the current date in DDMMYY format
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const year = String(currentDate.getFullYear()).slice(-2); // Get last two digits of the year

    // Generate a unique numeric request number
    const existingScrapItems = await ScrapItem.find({});
    const requestNumber = existingScrapItems.length + 1; // Simple incrementing number

    // Construct the requestId
    const requestId = `${day}${month}${year}${requestNumber}`;

    // Create a new ScrapItem instance with the generated requestId
    const newScrapItem = new ScrapItem({
      authToken: authToken, // Setting the authToken from the header

      scrapItems: parsedScrapItems,
      name,
      image: req.file ? req.file.path : null,
      pickUpDate,
      pickUpTime,
      location,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      requestId: requestId // Set the requestId to the formatted string
    });

    // Save the new scrap item to the database
    await newScrapItem.save();

    // Send back the created item with the specified response format
    res.status(200).json({
      status: 200,
      data: {
        requestId: newScrapItem.requestId, // Use the generated requestId
      },
      message: 'Request created successfully',
    });
  } catch (error) {
    console.error("Error creating scrap item:", error);
    res.status(500).json({
      message: 'Error creating scrap item',
      error: error.message || 'Internal server error',
    });
  }
};


// Controller to fetch all scrap requests based on authToken and role
// Fetch requests based on authToken from headers
const getRequestsByAuthTokenAndRole = async (req, res) => {
  try {
      // Extract authToken from headers
      const authToken = req.headers.authorization?.split(" ")[1]; // Assumes 'Bearer YOUR_ACCESS_TOKEN' format

      if (!authToken) {
          return res.status(400).json({
              message: 'Auth token must be provided in headers.',
          });
      }

      // Extract userId from the URL parameters
      const { id } = req.params;

      // Fetch all scrap items associated with the authToken and userId
      const scrapRequests = await ScrapItem.find({ authToken, id }); // Modify the query to include userId

      if (scrapRequests.length === 0) {
          return res.status(404).json({
              message: 'No requests found for the provided auth token and user ID.',
          });
      }

      res.status(200).json({
          message: 'Fetched all requests successfully.',
          data: scrapRequests,
      });
  } catch (error) {
      console.error('Error fetching requests by auth token:', error);
      res.status(500).json({
          message: 'Error fetching requests',
          error: error.message,
      });
  }
};


  // Controller to fetch a single scrap request by request ID
  // Controller to fetch a single scrap request by request ID
  const getRequestById = async (req, res) => {
    try {
        const { requestId } = req.params; // Extract requestId from route parameters
        console.log("Received requestId:", requestId); // Log the received requestId

        // Validate the requestId format
        if (!requestId) {
            return res.status(400).json({
                message: 'Request ID must be provided.',
            });
        }

        // Fetch the scrap request by its _id (or appropriate identifier)
        const scrapRequest = await ScrapItem.findById("66f988e33d584b3431f81af9"); // Use actual ID of ScrapItem here

        if (!scrapRequest || !scrapRequest.scrapItems) {
            console.log("No scrap requests found or scrapItems array is empty.");
            return res.status(404).json({
                message: 'No requests found.',
            });
        }

        // Find the specific scrap item by requestId within the scrapItems array
        const foundItem = scrapRequest.scrapItems.find(item => item.requestId === requestId); // Change _id to requestId

        if (!foundItem) {
            console.log("No scrap item found with the requestId:", requestId);
            return res.status(404).json({
                message: 'No request found with the provided request ID.',
            });
        }

        // Exclude authToken from the response (if needed)
        const { authToken, ...rest } = foundItem.toObject();

        res.status(200).json({
            message: 'Fetched request successfully.',
            data: { requestId, ...rest },
        });
    } catch (error) {
        console.error('Error fetching request by ID:', error);
        res.status(500).json({
            message: 'Error fetching request',
            error: error.message,
        });
    }
};

  

  
  

module.exports = { createScrapItem ,getRequestsByAuthTokenAndRole,getRequestById};
