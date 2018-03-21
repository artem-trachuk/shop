var mongoose = require('mongoose');
var schemaTypes = mongoose.Schema.Types;

var productSchema = new mongoose.Schema({
    imagePath: String,
    title: String,
    price: Number,
    USDprice: Number,
    article: Number,
    description: String,
    categories: {
        type: [schemaTypes.ObjectId],
        ref: 'Category'
    },
    data: {
        type: [{
            field: {
                type: schemaTypes.ObjectId,
                ref: 'Field'
            },
            fieldValue: String
        }]
    }
});

module.exports = mongoose.model('Product', productSchema);