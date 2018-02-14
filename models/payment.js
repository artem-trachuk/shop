var mongoose = require('mongoose');

var paymentSchema = new mongoose.Schema({
    name: String,
    description: String,
    show: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Payment', paymentSchema);