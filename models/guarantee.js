var mongoose = require('mongoose');

var schemaTypes = mongoose.Schema.Types;

var guaranteeSchema = new mongoose.Schema({
    order: {
        type: schemaTypes.ObjectId,
        ref: 'Order'
    },
    serial: String,
    productTitle: String, // in case if product was deleted
    product: {
        type: schemaTypes.ObjectId,
        ref: 'Product'
    }
});

module.exports = mongoose.model('Guarantee', guaranteeSchema);