var express = require('express');
var router = express.Router();

var csrf = require('csurf');
router.use(csrf());

var Cart = require('../models/cart');
var Product = require('../models/product');
var Order = require('../models/order');
var Payment = require('../models/payment');
var Shipping = require('../models/shipping');
var ShippingField = require('../models/shipping-field');
var ShippingFieldData = require('../models/shipping-field-data');
var User = require('../models/user');
var Counter = require('../models/counter');

/* GET Cart. */
router.get('/', (req, res, next) => {
    req.session.callbackUrl = '/cart';
    Shipping.find()
        .then(ships => {
            res.locals.ships = ships;
            return Payment.find();
        })
        .then(payments => {
            res.locals.payments = payments;
            next();
        });
}, function (req, res, next) {
    res.locals.title = 'Корзина - ' + res.locals.shopTitle;
    if (req.user) {
        User.findById(req.user.id)
            .then(user => {
                if (user.cart) {
                    res.locals.products = user.cart.products;
                    res.locals.totalPrice = user.cart.totalPrice;
                }
                next();
            });
    } else if (req.session.cart) {
        res.locals.products = req.session.cart.products;
        res.locals.totalPrice = req.session.cart.totalPrice;
        next();
    } else {
        next();
    }
}, (req, res, next) => {
    res.render('cart', {
        csrfToken: req.csrfToken()
    });
});

router.post('/', (req, res, next) => {
    req.session.paymentId = req.body.paymentSelect;
    req.session.shippingId = req.body.shippingSelect;
    res.redirect('/cart/checkout');
});

/* GET Checkout. */
router.get('/checkout', function (req, res, next) {
    Shipping.findById(req.session.shippingId)
        .then(shipping => {
            res.locals.shipping = shipping;
            return ShippingField.find({
                _id: {
                    $in: shipping.fields
                }
            });
        })
        .then(shippingFields => {
            res.locals.shippingFields = shippingFields;
            next();
        });
}, (req, res, next) => {
    Payment.findById(req.session.paymentId)
        .then(payment => {
            res.locals.payment = payment;
            next();
        });
}, (req, res, next) => {
    res.locals.title = 'Оформить заказ - ' + res.locals.shopTitle;
    res.render('checkout', {
        csrfToken: req.csrfToken()
    });
});

/* POST Checkout. */
router.post('/checkout', (req, res, next) => {
    if (req.session.cart) {
        req.cart = req.session.cart;
        next();
    } else if (req.user) {
        User.findById(req.user.id)
            .then(user => {
                req.cart = user.cart;
                next();
            });
    } else {
        res.redirect('/cart');
    }
}, function (req, res, next) {
    const shippingId = req.session.shippingId;
    const paymentId = req.session.paymentId;
    var fields = req.body;
    fieldsLength = Object.keys(fields).length;
    var done = 0;
    Counter.findOneAndUpdate({
        $inc: {
            order: 1
        }
    })
    .then(counter => {
        Order.create({
            orderDate: new Date(),
            user: req.user,
            cart: req.cart,
            article: counter.order,
            shipping: shippingId,
            payment: paymentId
        })
        .then(order => {
            req.orderId = order.id;
            for (f in fields) {
                (function (field) {
                    if (field === '_csrf') {
                        done++;
                    } else {
                        ShippingFieldData.create({
                                orderId: order.id,
                                fieldId: field,
                                fieldData: fields[f]
                            })
                            .then(createResult => {
                                done++;
                                if (done === fieldsLength) {
                                    next();
                                }
                            });
                    }
                })(f);
            }
        });
    })
}, (req, res, next) => {
    if (req.user) {
        User.findByIdAndUpdate(req.user.id, {
                $unset: {
                    cart: ""
                }
            })
            .then(updRes => {
                next();
            });
    } else if (req.session.cart) {
        next();
    }
}, (req, res, next) => {
    if (req.session.cart) {
        req.session.cart = null;
        if (!req.session.orders) {
            req.session.orders = [];
        }
        req.session.orders.push(req.orderId);
    }
    req.flash('success', 'Ваш заказ сохранен.');
    res.redirect('/cart/order/' + req.orderId);
});

router.get('/order/:id', (req, res, next) => {
    var showError = function () {
        req.flash('errors', 'У вас нет доступа к данной странице.');
        res.redirect('/');
    }
    if (req.session.orders) {
        if (req.session.orders.indexOf(req.params.id) !== -1) {
            Order.findById(req.params.id)
                .then(order => {
                    if (order) {
                        req.order = order;
                        next();
                    } else {
                        showError();
                    }
                })
        } else {
            showError();
        }
    } else if (req.user) {
        Order.findOne({
                user: req.user.id,
                _id: req.params.id
            })
            .then(order => {
                if (order) {
                    req.order = order;
                    next();
                } else {
                    showError();
                }
            });
    } else {
        showError();
    }


}, (req, res, next) => {
    res.locals.order = req.order;
    switch (req.order.status) {
        case 1:
            res.locals.status = 'Обрабатывается';
            break;
        case 2:
            res.locals.status = 'На складе';
            break;
        case 3:
            res.locals.status = 'Отправлен';
            break;
        case 4:
            res.locals.status = 'Получен';
            break;
        case 5:
            res.locals.status = 'Отказ';
            break;
    }
    ShippingFieldData.find({
            orderId: req.order.id
        })
        .then(data => {
            if (data.length === 0) {
                next();
            } else {
                shippingData = [];
                var done = 0;
                data.forEach(d => {
                    ShippingField.findById(d.fieldId)
                        .then(field => {
                            if (field) {
                                shippingData.push({
                                    fieldName: field.name,
                                    fieldData: d.fieldData
                                });
                            }
                            done++;
                            if (done === data.length) {
                                res.locals.shippingData = shippingData;
                                next();
                            }
                        });
                });
            }
        });
}, (req, res, next) => {
    Shipping.findById(req.order.shipping)
        .then(ship => {
            res.locals.shipping = ship.name;
            return Payment.findById(req.order.payment);
        })
        .then(payment => {
            res.locals.payment = payment.name;
            next();
        })
}, (req, res, next) => {
    res.locals.title = 'Заказ ' + res.locals.order._id + ' - ' + res.locals.shopTitle;
    res.render('order');
});

/* Add to cart. */
router.get('/add-to-cart/:id', function (req, res, next) {
    var productId = req.params.id;
    if (req.user) {
        User.findById(req.user.id)
            .then(user => {
                if (user.cart) {
                    req.cart = user.cart;
                    next();
                } else {
                    return User.findByIdAndUpdate(req.user.id, {
                        cart: Cart.create()
                    });
                }
            })
            .then(updRes => {
                User.findById(req.user.id)
                    .then(user => {
                        req.cart = user.cart;
                        next();
                    });
            });
    } else if (req.session.cart) {
        req.cart = req.session.cart;
        next();
    } else {
        req.cart = req.session.cart = Cart.create();
        next();
    }
}, (req, res, next) => {
    // Find requested item
    Product.findById(req.params.id)
        .then(product => {
            if (!product) {
                req.flash('errors', 'Неверно указан id продукта.');
                return res.redirect('/');
            }
            Cart.add(req.cart, product);
            if (req.user) {
                User.findByIdAndUpdate(req.user.id, {
                        cart: req.cart
                    })
                    .then(updResult => {
                        next();
                    })
            } else {
                next();
            }
        });
}, (req, res, next) => {
    res.redirect(req.session.callbackUrl);
});

router.get('/remove-from-cart/:id', (req, res, next) => {
    if (req.user) {
        User.findById(req.user.id)
            .then(user => {
                req.cart = user.cart;
                next();
            });
    } else {
        req.cart = req.session.cart;
        next();
    }
}, (req, res, next) => {
    Product.findById(req.params.id)
        .then(product => {
            if (!product) {
                req.flash('errors', 'Неверно указан id продукта.');
                return res.redirect('/');
            }
            Cart.remove(req.cart, product);
            if (req.user) {
                if(req.cart.totalQty === 0) {
                    User.findByIdAndUpdate(req.user.id, {
                        $unset: {
                            cart: ""
                        }
                    })
                    .then(updResult => {
                        next();
                    });
                } else {
                    User.findByIdAndUpdate(req.user.id, {
                        cart: req.cart
                    })
                    .then(updResult => {
                        next();
                    });
                }
            } else {
                if (req.cart.totalQty === 0) {
                    req.session.cart = null;
                }
                next();
            }
        });
}, (req, res, next) => {
    res.redirect('/cart');
});

module.exports = router;