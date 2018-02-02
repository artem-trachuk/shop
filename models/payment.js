var mongoose = require('mongoose');

var paymentSchema = new mongoose.Schema({
    name: String,
    description: String
});

module.exports = mongoose.model('Payment', paymentSchema);