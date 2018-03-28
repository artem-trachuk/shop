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