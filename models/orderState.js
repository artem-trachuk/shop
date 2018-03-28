var mongoose = require('mongoose');
var schemaTypes = mongoose.Schema.Types;

var orderStatesSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('OrderState', orderStatesSchema);