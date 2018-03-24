var mongoose = require('mongoose');
var schemaTypes = mongoose.Schema.Types;

var adminSchema = new mongoose.Schema({
    user: {
        type: schemaTypes.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Admin', adminSchema);