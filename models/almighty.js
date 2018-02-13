var mongoose = require('mongoose');
var schemaTypes = mongoose.Schema.Types;

var almightySchema = new mongoose.Schema({
    user: {
        type: schemaTypes.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Almighty', almightySchema);