var mongoose = require('mongoose');
var schemaTypes = mongoose.Schema.Types;

var orderSchema = new mongoose.Schema({
    cart: Object,
    state: { 
        type: String
    },
    user: {
        type: schemaTypes.ObjectId,
        ref: 'User'
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