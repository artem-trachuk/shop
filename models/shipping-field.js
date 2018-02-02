var mongoose = require('mongoose');

var shippingFieldSchema = new mongoose.Schema({
    name: String
});

module.exports = mongoose.model('ShippingField', shippingFieldSchema);