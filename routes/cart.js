var express = require('express');
var router = express.Router();
var moment = require('moment');
moment.locale('ru');
var mongoose = require('mongoose');
var csrf = require('csurf');
router.use(csrf());

var Cart = require('../models/cart');
var Product = require('../models/product');
var Order = require('../models/order');
var Payment = require('../models/payment');
var Shipping = require('../models/shipping');
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
    var done = 0;
    if (!res.locals.products) {
        return next();
    }
    var length = Object.keys(res.locals.products).length;
    var checkDone = function () {
        done++;
        if (done === length) {
            next();
        };
    }
    // next();
    for (product in res.locals.products) {
        (function (prd) {
            Product.findById(prd)
                .then(p => {
                    res.locals.products[prd].imagePath = p.imagePath;
                    checkDone();
                }).catch(err => next(err));
        })(product);
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
            next();
        }).catch(err => next(err));
}, (req, res, next) => {
    Payment.findById(req.session.paymentId)
        .then(payment => {
            res.locals.payment = payment;
            next();
        }).catch(err => next(err));
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
    var order = new Order();
    order.user = req.user;
    order.cart = req.cart;
    order.clientsNote = req.body.clientsNote;
    Counter.findOneAndUpdate({
            $inc: {
                order: 1
            }
        })
        .then(counter => {
            order.article = counter.order;
            return Shipping.findById(shippingId);
        })
        .then(shipping => {
            var fieldsResult = [];
            for (field in fields) {
                if (field.indexOf('ship') > -1) {
                    fieldsResult.push({
                        field: shipping.fields.find(f => f.id === field.slice(5)).field,
                        value: fields[field]
                    });
                }
            }
            order.shipping = {
                name: shipping.name,
                fields: fieldsResult
            }
            return Payment.findById(paymentId);
        })
        .then(payment => {
            var fieldsResult = [];
            for (field in fields) {
                if (field.indexOf('pay') > -1) {
                    fieldsResult.push({
                        field: payment.fields.find(f => f.id === field.slice(4)).field,
                        value: fields[field]
                    });
                }
            }
            order.payment = {
                name: payment.name,
                fields: fieldsResult
            }
            return order.save();
        })
        .then(save => {
            req.orderId = save.id;
            next();
        })
        .catch(err => next(err));
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
                        res.locals.order = order;
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
                    order.date = moment(mongoose.Types.ObjectId(order._id).getTimestamp()).format("MMM Do YY");
                    res.locals.order = order;
                    next();
                } else {
                    showError();
                }
            });
    } else {
        showError();
    }
}, (req, res, next) => {
    res.locals.title = 'Заказ ' + res.locals.order.article + ' - ' + res.locals.shopTitle;
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
    Cart.remove(req.cart, {
        id: req.params.id
    });
    if (req.user) {
        if (req.cart.totalQty === 0) {
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
}, (req, res, next) => {
    res.redirect('/cart');
});

module.exports = router;