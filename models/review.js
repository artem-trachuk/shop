var mongoose = require('mongoose');
var schemaTypes = mongoose.Schema.Types;

var reviewSchema = new mongoose.Schema({
    user: {
        type: schemaTypes.ObjectId,
        ref: 'User'
    },
    review: String
});

module.exports = mongoose.model('Review', reviewSchema);