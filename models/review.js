var mongoose = require('mongoose');
var schemaTypes = mongoose.Schema.Types;

var reviewSchema = new mongoose.Schema({
    user: {
        type: schemaTypes.ObjectId,
        ref: 'User'
    },
    review: String,
    date: Date,
    checked: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Review', reviewSchema);