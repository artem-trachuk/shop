var express = require('express');
var router = express.Router();

var csrf = require('csurf');
router.use(csrf());

var Config = require('../models/config');
var Product = require('../models/product');
var Order = require('../models/order');

/* GET Admin page. */
router.get('/', function (req, res, next) {
  Config.findOne()
    .then(one => res.render('admin', {
      title: 'Admin',
      USDtoUAH: one.USDtoUAH,
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
      one.save()
        .then(savedOne => res.redirect('/admin'))
        .catch(err => res.redirect('/'));
    })
    .catch(err => res.redirect('/'));
});

/* GET Admin Products page. */
router.get('/products', function (req, res, next) {
  Product.find()
    .then(docs => res.render('admin/products', {
      products: docs,
      title: 'Продукты'
    }))
    .catch(err => res.redirect('/'));
});

/* GET Admin product editor. */
router.get('/product/', function (req, res, next) {
  res.render('admin/product', {
    csrfToken: req.csrfToken()
  });
});

/* GET Admin product editor by id. */
router.get('/product/:id', function (req, res, next) {
  productId = req.params.id;
  Product.findById(productId)
    .then(doc => res.render('admin/product', {
      product: doc,
      csrfToken: req.csrfToken()
    }))
    .catch(err => res.redirect('/'));
});

/* POST Admin product. */
router.post('/product', function (req, res, next) {
  product = req.body;
  Product.create(product)
    .then(insertRes => res.redirect('/admin/product/' + insertRes.id))
    .catch(err => { });
});

/* POST Admin product by id. */
router.post('/product/:id', function (req, res, next) {
  productId = req.params.id;
  product = req.body;
  Product.findById(productId)
    .then(doc => {
      doc.title = product.title;
      doc.price = parseFloat(product.price);
      doc.USDprice = parseFloat(product.USDprice);
      doc.save()
        .then(res.redirect('/admin/product/' + productId));
    })
    .catch(err => res.redirect('/'));
});

/* GET Admin Orders page. */
router.get('/orders', function (req, res, next) {
  Order.find()
  .then(orders => {
    res.render('admin/orders', {
      orders: orders
    });
  });
});

module.exports = router;