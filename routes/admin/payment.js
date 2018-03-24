var express = require('express');
var router = express.Router();

var Payment = require('../../models/payment');

var csrf = require('csurf');
router.use(csrf());

router.get('/', (req, res, next) => {
    res.locals.title = 'Панель управления / Шаблоны оплаты - ' + res.locals.shopTitle;
    res.locals.paymentMenu = true;
    next();
}, (req, res, next) => {
    Payment.find()
        .then(allPayments => {
            res.locals.allPayments = allPayments;
            res.render('admin/payment');
        }).catch(err => next(err));
});

router.get('/editor', (req, res, next) => {
    res.locals.title = 'Панель управления / Шаблоны оплаты / Редактор - ' + res.locals.shopTitle;
    res.locals.csrfToken = req.csrfToken();
    res.render('admin/paymentEditor');
});

router.post('/editor', (req, res, next) => {
    var formData = req.body;
    var show = formData.show === 'on' ? true : false;
    Payment.create({
        name: formData.name,
        description: formData.description,
        show: show
    }).then(createResult => {
        res.redirect('/admin/payment/editor/' + createResult.id);
    }).catch(err => next(err));
});

router.get('/editor/:id', (req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    res.locals.title = 'Панель управления / Шаблоны оплаты / Редактор - ' + res.locals.shopTitle;
    Payment.findById(req.params.id).then(payment => {
        if (payment) {
            res.locals.payment = payment;
            res.render('admin/paymentEditor');
        } else {
            req.flash('errors', 'Неверно указан id шаблона оплаты.');
            res.redirect('/admin/payment');
        }
    }).catch(err => next(err));
});

router.post('/editor/:id', (req, res, next) => {
    var formData = req.body;
    var show = formData.show === 'on' ? true : false;
    Payment.findByIdAndUpdate(req.params.id, {
        name: formData.name,
        description: formData.description,
        show: show
    }).then(createResult => {
        res.redirect('/admin/payment/editor/' + createResult.id);
    }).catch(err => next(err));
});

router.post('/editor/:id/add-field', (req, res, next) => {
    Payment.findByIdAndUpdate(req.params.id, {
        $push: {
            fields: {
                field: req.body.field,
                required: req.body.isRequired === 'on' ? true : false
            }
        }
    }).then(updateResult => {
        res.redirect('/admin/payment/editor/' + req.params.id);
    }).catch(err => next(err));
});

router.post('/editor/:id/change-field/:fieldId', (req, res, next) => {
    var field = req.body.field;
    var isRequired = req.body.isRequired === 'on' ? true : false;
    if (field.length > 0) {
        Payment.findOneAndUpdate({_id: req.params.id, 'fields._id': req.params.fieldId}, {
            $set: {
                'fields.$.field': field,
                'fields.$.required': isRequired
            }
        }).then(updateResult => {
            res.redirect('/admin/payment/editor/' + req.params.id);
        }).catch(err => next(err));
    } else {
        Payment.findByIdAndUpdate(req.params.id, {
            $pull: {
                fields: {
                    _id: req.params.fieldId
                }
            }
        }).then(updateResult => {
            res.redirect('/admin/payment/editor/' + req.params.id);
        }).catch(err => next(err));
    }
});

module.exports = router;