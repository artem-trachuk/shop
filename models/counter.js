var mongoose = require('mongoose');

var counterSchema = new mongoose.Schema({
    product: {
        type: Number,
        default: 100
    },
    order: {
        type: Number,
        default: 100
    }
});

module.exports = mongoose.model('Counter', counterSchema);