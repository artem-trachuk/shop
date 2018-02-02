var mongoose = require('mongoose');

var productSchema = new mongoose.Schema({
    imagePath: String,
    title: String,
    price: Number,
    article: Number,
    USDprice: Number,
    description: String,
    categories: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Category'
    }
});

module.exports = mongoose.model('Product', productSchema);