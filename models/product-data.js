var mongoose = require('mongoose');

var schemaTypes = mongoose.Schema.Types;

var productDataSchema = new mongoose.Schema({
    productId: {
        type: schemaTypes.ObjectId,
        ref: 'Product'
    },
    fieldId: {
        type: schemaTypes.ObjectId,
        ref: 'Field'
    },
    fieldValue: String
});

module.exports = mongoose.model('ProductData', productDataSchema);