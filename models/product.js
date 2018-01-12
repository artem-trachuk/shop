var mongoose = require('mongoose');

var productSchema = new mongoose.Schema({
    imagePath: String,
    title: String,
    price: Number,
    description: String
});

module.exports = mongoose.model('Product', productSchema);