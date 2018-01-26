var mongoose = require('mongoose');
var schemaTypes = mongoose.Schema.Types;

var categorySchema = new mongoose.Schema({
    name: String,
    fields: {
        type: [schemaTypes.ObjectId],
        ref: 'Field'
    },
    parentCategoryId: {
        type: schemaTypes.ObjectId,
        ref: 'Category'
    }
});

module.exports = mongoose.model('Category', categorySchema);