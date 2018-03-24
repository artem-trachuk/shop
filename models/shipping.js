var mongoose = require('mongoose');
var schemaTypes = mongoose.Schema.Types;

var shippingSchema = new mongoose.Schema({
    name: String,
    description: String,
    show: {
        type: Boolean,
        default: true
    },
    fields: [String]
});

module.exports = mongoose.model('Shipping', shippingSchema);