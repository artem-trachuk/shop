var express = require('express');
var router = express.Router();

var Shipping = require('../../models/shipping');
var OrderState = require('../../models/orderState');

var csrf = require('csurf');
router.use(csrf());

router.get('/', (req, res, next) => {
    OrderState.find().then(states => {
        res.locals.states = states;
        next();
    }).catch(err => next(err));
}, (req, res, next) => {
    res.locals.title = 'Панель управления / Шаблоны доставки - ' + res.locals.shopTitle;
    res.locals.shippingMenu = true;
    res.locals.csrfToken = req.csrfToken();
    next();
}, (req, res, next) => {
    Shipping.find()
        .then(allShip => {
            res.locals.allShip = allShip;
            res.render('admin/shipping');
        }).catch(err => next(err));
});

router.get('/editor', (req, res, next) => {
    res.locals.title = 'Панель управления / Шаблоны доставки / Редактор - ' + res.locals.shopTitle;
    res.locals.csrfToken = req.csrfToken();
    res.render('admin/shippingEditor');
});

router.post('/editor', (req, res, next) => {
    var formData = req.body;
    var show = formData.show === 'on' ? true : false;
    Shipping.create({
        name: formData.name,
        description: formData.description,
        show: show
    }).then(createResult => {
        res.redirect('/admin/shipping/editor/' + createResult.id);
    }).catch(err => next(err));
});

router.get('/editor/:id', (req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    res.locals.title = 'Панель управления / Шаблоны доставки / Редактор - ' + res.locals.shopTitle;
    Shipping.findById(req.params.id).then(shipping => {
        if (shipping) {
            res.locals.shipping = shipping;
            res.render('admin/shippingEditor');
        } else {
            req.flash('errors', 'Неверно указан id шаблона доставки.');
            res.redirect('/admin/shipping');
        }
    }).catch(err => next(err));
});

router.post('/editor/:id', (req, res, next) => {
    var formData = req.body;
    var show = formData.show === 'on' ? true : false;
    Shipping.findByIdAndUpdate(req.params.id, {
        name: formData.name,
        description: formData.description,
        show: show
    }).then(createResult => {
        res.redirect('/admin/shipping/editor/' + createResult.id);
    }).catch(err => next(err));
});

router.post('/editor/:id/add-field', (req, res, next) => {
    Shipping.findByIdAndUpdate(req.params.id, {
        $push: {
            fields: {
                field: req.body.field,
                required: req.body.isRequired === 'on' ? true : false
            }
        }
    }).then(updateResult => {
        res.redirect('/admin/shipping/editor/' + req.params.id);
    }).catch(err => next(err));
});

router.post('/editor/:id/change-field/:fieldId', (req, res, next) => {
    var field = req.body.field;
    var isRequired = req.body.isRequired === 'on' ? true : false;
    if (field.length > 0) {
        Shipping.findOneAndUpdate({
            _id: req.params.id,
            'fields._id': req.params.fieldId
        }, {
            $set: {
                'fields.$.field': field,
                'fields.$.required': isRequired
            }
        }).then(updateResult => {
            res.redirect('/admin/shipping/editor/' + req.params.id);
        }).catch(err => next(err));
    } else {
        Shipping.findByIdAndUpdate(req.params.id, {
            $pull: {
                fields: {
                    _id: req.params.fieldId
                }
            }
        }).then(updateResult => {
            res.redirect('/admin/shipping/editor/' + req.params.id);
        }).catch(err => next(err));
    }
});

router.post('/state', (req, res, next) => {
    var state = req.body;
    OrderState.create({
        title: state.title
    }).then(createResult => {
        res.redirect('/admin/shipping');
    }).catch(err => next(err));
});

router.post('/state/:id', (req, res, next) => {
    var state = req.body;
    if (state.title.length === 0) {
        OrderState.findByIdAndRemove(req.params.id).then(next()).catch(err => next(err));
    } else {
        OrderState.findByIdAndUpdate(req.params.id, {
            title: state.title
        }).then(updResult => {
            next();
        }).catch(err => next(err));
    }
}, (req, res, next) => {
    res.redirect('/admin/shipping');
});

module.exports = router;