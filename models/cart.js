module.exports.add = function(cart, product) {
    var products = cart.products;
    var storedProduct = products[product.id];
    if (!storedProduct) {
        storedProduct = products[product.id] = {
            product: {
                id: product.id,
                title: product.title,
                price: product.price
            },
            qty: 0,
            price: 0
        };
    }
    storedProduct.qty++;
    storedProduct.price = storedProduct.product.price * storedProduct.qty;
    cart.totalPrice += storedProduct.product.price;
    cart.totalQty++;
};

module.exports.remove = function(cart, product) {
    var products = cart.products;
    var removeProduct = products[product.id];
    removeProduct.qty--;
    if (removeProduct.qty === 0) {
        delete products[product.id];
    }
    removeProduct.price = removeProduct.product.price * removeProduct.qty;
    cart.totalPrice -= removeProduct.product.price;
    cart.totalQty--;
}

module.exports.create = function() {
    return {
        products: {},
        totalPrice: 0,
        totalQty: 0
    };
}

// module.exports = function Cart(oldCart) {
//     this.items = oldCart.items || {};
//     this.totalQty = oldCart.totalQty || 0;
//     this.totalPrice = oldCart.totalPrice || 0;

//     this.add = function (item, id) {
//         return new Promise((resolve, reject) => {
//             var storedItem = this.items[id];
//             if (!storedItem) {
//                 storedItem = this.items[id] = {
//                     item: {
//                         id: item.id,
//                         title: item.title,
//                         price: item.price
//                     },
//                     qty: 0,
//                     price: 0
//                 };
//             }
//             storedItem.qty++;
//             storedItem.price = storedItem.item.price * storedItem.qty;
//             this.totalPrice += storedItem.item.price;
//             this.totalQty++;
//             resolve();
//         });
//     }

//     this.generateArr = function () {
//         var arr = [];
//         for (var id in this.items) {
//             arr.push(this.items[id]);
//         }
//         return arr;
//     }
// };