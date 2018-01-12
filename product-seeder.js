var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/shop');
var Product = require('./models/product');

var products = [
    new Product({
        imagePath: 'https://img.routerboard.com/mimg/1040_l.jpg',
        description: 'The RB750r2 (hEX lite) is a small five port ethernet router in a nice plastic case.',
        title: 'hEX lite',
        price: 2500
    }),
    new Product({
        imagePath: 'https://img.routerboard.com/mimg/1040_l.jpg',
        description: 'The RB750r2 (hEX lite) is a small five port ethernet router in a nice plastic case.',
        title: 'hEX lite',
        price: 2500
    }),
    new Product({
        imagePath: 'https://img.routerboard.com/mimg/1040_l.jpg',
        description: 'The RB750r2 (hEX lite) is a small five port ethernet router in a nice plastic case.',
        title: 'hEX lite',
        price: 2500
    }),
    new Product({
        imagePath: 'https://img.routerboard.com/mimg/1040_l.jpg',
        description: 'The RB750r2 (hEX lite) is a small five port ethernet router in a nice plastic case.',
        title: 'hEX lite',
        price: 2500
    }),
    new Product({
        imagePath: 'https://img.routerboard.com/mimg/1040_l.jpg',
        description: 'The RB750r2 (hEX lite) is a small five port ethernet router in a nice plastic case.',
        title: 'hEX lite',
        price: 2500
    }),
    new Product({
        imagePath: 'https://img.routerboard.com/mimg/1040_l.jpg',
        description: 'The RB750r2 (hEX lite) is a small five port ethernet router in a nice plastic case.',
        title: 'hEX lite',
        price: 2500
    })
];

var done = 0;
for(var i = 0; i < products.length; i++) {
    products[i].save(function(err, res) {
        done++;
        if (done === products.length) {
            mongoose.disconnect();
        }
    });
}