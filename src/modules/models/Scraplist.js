// models/ScrapItem.js
const mongoose = require('mongoose');

const ScrapItemSchema = new mongoose.Schema({
  authToken: { type: String, required: true },
  scrapItems: [
    {
      name: { type: String, required: true },
      price: { type: String, required: true },
      weight: { type: Number, required: true }
    }
  ],



  name: { type: String, required: true },
  image: { type: String },
  formimage: { type: String },//add on delivery boy manuaaly added this image 
  pickUpDate: { type: Date, required: true }, // New field for pickup date
  pickUpTime: { type: String, required: true }, // New field for pickup time as string
  location: { type: String, required: true },
  latitude: { type: Number, }, // New field for latitude
  longitude: { type: Number, } , // New field for longitude
  requestId: { type: String, required: true, unique: true }, // Ensure this is included

});

module.exports = mongoose.model('ScrapItem', ScrapItemSchema);
