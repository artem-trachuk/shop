var express = require('express');
var router = express.Router();

var csrf = require('csurf');
router.use(csrf());

var Config = require('../../models/config');
var Payment = require('../../models/payment');
var Shipping = require('../../models/shipping');
var ShippingField = require('../../models/shipping-field');

router.get('/', (req, res, next) => {
    res.locals.errors = req.flash('errors');
    res.locals.success = req.flash('success');
    Config.findOne()
        .then(conf => {
            res.locals.title = 'Панель управления / Доставка и оплата - ' + conf.title;
            next();
        });
}, (req, res, next) => {
    Payment.find()
        .then(payments => {
            if (payments.length > 0) {
                res.locals.payments = payments;
            }
            next();
        });
}, (req, res, next) => {
    Shipping.find()
        .then(ships => {
            if (ships.length > 0) {
                res.locals.ships = ships;
            }
            next();
        });
}, (req, res, next) => {
    res.render('admin/shipping-and-payment', {
        csrfToken: req.csrfToken()
    });
});

router.post('/add-payment', (req, res, next) => {
    var payment = req.body;
    Payment.create(payment)
        .then(createResult => {
            req.flash('success', 'Способ оплаты добавлен');
            res.redirect('/admin/shipping-and-payment');
        });
});

router.post('/add-shipping', (req, res, next) => {
    var shipping = req.body;
    Shipping.create(shipping)
        .then(createResult => {
            req.flash('success', 'Способ доставки добавлен');
            res.redirect('/admin/shipping-and-payment/shipping/' + createResult.id);
        });
});

router.get('/shipping/:id', (req, res, next) => {
    Shipping.findById(req.params.id)
        .then(shipping => {
            res.locals.shipping = shipping;
            ShippingField.find({
                _id: {
                    $in: shipping.fields
                }
            }).then(fields => {
                res.locals.fields = fields;
                next();
            })
        });
}, (req, res, next) => {
    Config.findOne()
        .then(conf => {
            res.locals.title = 'Панель управления / Доставка и оплата / Доставка / ' + res.locals.shipping.name + ' - ' + conf.title;
            next();
        });
}, (req, res, next) => {
    res.render('admin/shipping', {
        errors: req.flash('errors'),
        success: req.flash('success'),
        csrfToken: req.csrfToken()
    });
});

router.post('/shipping/:id', (req, res, next) => {
    Shipping.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        description: req.body.description
    })
    .then(updRes => {
        res.redirect('/admin/shipping-and-payment/shipping/' + req.params.id);
    })
});

router.post('/shipping/:id/shipping-field/:fieldid', (req, res, next) => {
    const fieldId = req.params.fieldid;
    ShippingField.findByIdAndUpdate(fieldId, {
        name: req.body.name
    })
    .then(updResult => {
        res.redirect('/admin/shipping-and-payment/shipping/' + req.params.id);
    });
});

router.post('/shipping/:id/add-field', (req, res, next) => {
    Shipping.findById(req.params.id)
        .then(shipping => {
            if (shipping) {
                ShippingField.create(req.body)
                    .then(field => {
                        req.flash('success', 'Поле ' + field.name + ' добавлено.');
                        shipping.fields.push(field);
                        shipping.save()
                            .then(s => {
                                next();
                            });
                    });
            } else {
                req.flash('errors', 'Не удалось найти способ доставки.');
                next();
            }
        });
}, (req, res, next) => {
    res.redirect('/admin/shipping-and-payment/shipping/' + req.params.id);
});

router.get('/payment/:id', (req, res, next) => {
    Payment.findById(req.params.id)
    .then(payment => {
        res.locals.payment = payment;
        res.render('admin/payment', {
            csrfToken: req.csrfToken()
        });
    });
});

router.post('/payment/:id', (req, res, next) => {
    Payment.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        description: req.body.description
    })
    .then(updResult => {
        res.redirect('/admin/shipping-and-payment/payment/' + req.params.id);
    })
});

module.exports = router;