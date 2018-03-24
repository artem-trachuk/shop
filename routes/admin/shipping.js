var express = require('express');
var router = express.Router();

var Shipping = require('../../models/shipping');

var csrf = require('csurf');
router.use(csrf());

router.get('/', (req, res, next) => {
    res.locals.title = 'Панель управления / Шаблоны доставки - ' + res.locals.shopTitle;
    res.locals.shippingMenu = true;
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
            for (var i = 0; i < shipping.fields.length; i++) {
                shipping.fields[i] = {
                    index: i,
                    value: shipping.fields[i]
                };
            }
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
            fields: req.body.field
        }
    }).then(updateResult => {
        res.redirect('/admin/shipping/editor/' + req.params.id);
    }).catch(err => next(err));
});

router.post('/editor/:id/change-field/:fieldId', (req, res, next) => {
    var index = 'fields.' + req.params.fieldId
    Shipping.findByIdAndUpdate(req.params.id, {
        $set: {
            [index]: req.body.field
        }
    }).then(updateResult => {
        res.redirect('/admin/shipping/editor/' + req.params.id);
    }).catch(err => next(err));
});

module.exports = router;