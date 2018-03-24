var mongoose = require('mongoose');
var schemaTypes = mongoose.Schema.Types;

/*
    Status codes:
    0 - new
    1 - pending
    2 - in a depot
    3 - sent to a buyer
    4 - received
    5 - failure
*/
var orderSchema = new mongoose.Schema({
    cart: Object,
    status: { type: Number, default: 0 },
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
    clientsNote: String,
    workingNote: String,
    noteForClient: String,
    shipping: {
        name: String,
        fields: [{
            field: String,
            value: String
        }]
    },
    payment: {
        name: String,
        fields: [{
            field: String,
            value: String
        }]
    },
    article: Number
});

module.exports = mongoose.model('Order', orderSchema);