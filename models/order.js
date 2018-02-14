var mongoose = require('mongoose');
var schemaTypes = mongoose.Schema.Types;

/*
    Status codes:
    1 - pending
    2 - in a depot
    3 - sent to a buyer
    4 - received
    5 - failure
*/
var orderSchema = new mongoose.Schema({
    cart: Object,
    status: { type: Number, default: 1 },
    user: {
        type: schemaTypes.ObjectId,
        ref: 'User'
    },
    orderDate: {
        type: Date
    },
    reciveDate: {
        type: Date
    },
    clientNote: String,
    workingNote: String,
    shipping: {
        type: schemaTypes.ObjectId,
        ref: 'Shipping'
    },
    shippingFieldData: {
        type: [{
            fieldId: {
                type: schemaTypes.ObjectId,
                ref: 'ShippingField'
            },
            fieldValue: String
        }]
    },
    payment: {
        type: schemaTypes.ObjectId,
        ref: 'Payment'
    },
    article: Number
});

module.exports = mongoose.model('Order', orderSchema);