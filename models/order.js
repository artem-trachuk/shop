var mongoose = require('mongoose');

/*
    Status codes:
    1 - new order
    2 - pending
    3 - canceled by client
    4 - canceled by shop
    5 - products were sent to client
*/
var orderSchema = new mongoose.Schema({
    cart: Object,
    delivery: Object,
    status: { type: Number, default: 1 },
    statusMsg: { type: String },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    orderDate: {
        type: Date
    }
});

module.exports = mongoose.model('Order', orderSchema);