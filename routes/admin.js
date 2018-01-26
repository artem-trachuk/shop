var express = require('express');
var router = express.Router();

var csrf = require('csurf');
router.use(csrf());

var Config = require('../models/config');
var Product = require('../models/product');
var Order = require('../models/order');
var Category = require('../models/category');
var ProductData = require('../models/product-data');

router.use('*', (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.redirect('/user/signin');
  }
});

/* GET Admin page. */
router.get('/', function (req, res, next) {
  var errors = req.flash('errors');
  var success = req.flash('success');
  Config.findOne()
    .then(one => res.render('admin', {
      title: 'Панель управления - ' + one.title,
      shopTitle: one.title,
      USDtoUAH: one.USDtoUAH,
      address: one.address,
      description: one.description,
      phone: one.phone,
      errors: errors,
      success: success,
      adminMenu: true,
      csrfToken: req.csrfToken()
    }))
    .catch(err => res.redirect('/'));
});

/* POST admin. */
router.post('/', function (req, res, next) {
  conf = req.body;
  Config.findOne()
    .then(one => {
      one.USDtoUAH = parseFloat(conf.exchangeRate, 10);
      one.title = conf.shopTitle;
      one.address = conf.address;
      one.description = conf.description;
      one.phone = conf.phone;
      one.save()
        .then(savedOne => res.redirect('/admin'))
        .catch(err => {
          req.flash('error', 'Не удалось сохранить данные.');
          res.redirect('/admin');
        });
    })
    .catch(err => {
      req.flash('error', 'Не удалось получить данные.');
      res.redirect('/admin');
    });
});

/* GET Admin Orders page. */
router.get('/orders', function (req, res, next) {
  Order.find()
    .then(orders => {
      res.render('admin/orders', {
        orders: orders,
        ordersMenu: true
      });
    });
});

/* GET Admin Products page. */
router.get('/products', (req, res, next) => {
  Config.findOne()
  .then(conf => {
    res.locals.title = 'Панель управления / Продукты - ' + conf.title;
    next();
  })
  .catch(err => {
    req.flash('errors', 'Не удалось получить данные.');
    res.redirect('/admin');
  });
}, function (req, res, next) {
  Product.find()
    .then(docs => res.render('admin/products', {
      products: docs,
      productsMenu: true
    }))
    .catch(err => res.redirect('/'));
});

/* GET Admin Categories page. */
router.get('/categories', function (req, res, next) {
  Category.find({})
    .then(categories => res.render('admin/categories', {
      categories: categories,
      categoriesMenu: true
    }))
    .catch(err => console.log(err));
});

module.exports = router;