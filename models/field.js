var mongoose = require('mongoose');

fieldSchema = new mongoose.Schema({
    name: String
});

module.exports = mongoose.model('Field', fieldSchema);