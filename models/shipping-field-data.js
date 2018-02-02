var mongoose = require('mongoose');

var schemaTypes = mongoose.Schema.Types;

var shippingFieldDataSchema = new mongoose.Schema({
    orderId: {
        type: schemaTypes.ObjectId,
        ref: 'Order'
    },
    fieldId: {
        type: schemaTypes.ObjectId,
        ref: 'ShippingField'
    },
    fieldData: String
});

module.exports = mongoose.model('ShippingFieldData', shippingFieldDataSchema);