var Config = require('./config');

module.exports = function Cart(oldCart) {
    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;
    this.totalPriceString = oldCart.totalPriceString || new String();

    this.add = function (item, id) {
        return new Promise((resolve, reject) => {
            var storedItem = this.items[id];
            if (!storedItem) {
                storedItem = this.items[id] = {
                    item: item,
                    qty: 0,
                    price: 0
                };
            }
            storedItem.qty++;
            Config.findOne()
            .then(conf => {
                if (storedItem.item.USDprice > 0) {
                    storedItem.price = storedItem.item.USDprice * conf.USDtoUAH * storedItem.qty;
                    this.totalPrice += storedItem.item.USDprice * conf.USDtoUAH;
                } else {
                    storedItem.price = storedItem.item.price * storedItem.qty;
                    this.totalPrice += storedItem.item.price;
                }
                this.totalQty++;
                
                resolve();
            });
        });
    }

    this.generateArr = function () {
        var arr = [];
        for (var id in this.items) {
            arr.push(this.items[id]);
        }
        return arr;
    }
};