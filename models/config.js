var mongoose = require('mongoose');

var configSchema = new mongoose.Schema({
    USDtoUAH: {
        type: Number,
        default: 1
    }
});

module.exports = mongoose.model('Config', configSchema);