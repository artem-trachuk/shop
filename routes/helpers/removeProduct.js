var Product = require('../../models/product');
var fs = require('fs');
var conf = require('../../shop-config');

module.exports = function (productId) {
    return new Promise((resolve, reject) => {
        Product.findById(productId).then(product => {
            var imagePath = product.imagePath.replace('/uploads/', '');
            fs.unlink(conf.dest + imagePath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        }).catch(err => reject(err));
    });
}