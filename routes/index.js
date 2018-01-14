var express = require('express');
var router = express.Router();

var csrf = require('csurf');
router.use(csrf());

var Product = require('../models/product');
var Cart = require('../models/cart');
var Config = require('../models/config');
var Order = require('../models/order');

/* GET home page. */
router.get('/', function (req, res, next) {
  var messages = req.flash('success');
  Config.findOne()
    .then(one => {
      var products = Product.find(function (err, docs) {
        res.render('index', {
          title: 'Kalynovskyi & Co. магазин сетевого оборудования от специалистов, которые с ним работают',
          products: docs,
          messages: messages,
          hasErrors: messages.length > 0,
          exchangeRate: one.USDtoUAH
        });
      });
    })
    .catch(err => { });

});

/* Add to cart. */
router.get('/add-to-cart/:id', function (req, res, next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  // Find requested item
  Product.findById(productId, function (err, product) {
    if (err) {
      return res.redirect('/');
    }
    // Add product to user cart
    cart.add(product, product.id);
    // Save cart into session
    req.session.cart = cart;
    res.redirect('/');
  });
});

/* GET Cart. */
router.get('/cart', function (req, res, next) {
  // Empty cart
  if (!req.session.cart) {
    return res.render('cart', {
      products: null
    });
  }
  var cart = new Cart(req.session.cart);
  res.render('cart', {
    products: cart.generateArr(),
    totalPrice: cart.totalPrice
  });
});

/* GET Checkout. */
router.get('/checkout', function (req, res, next) {
  // Empty cart
  if (!req.session.cart) {
    return res.redirect('/cart');
  }
  res.render('checkout', {
    csrfToken: req.csrfToken()
  });
});

/* POST Checkout. */
router.post('/checkout', function (req, res, next) {
  // Empty cart
  if (!req.session.cart) {
    return res.redirect('/cart');
  }
  var delivery = req.body;
  var userCart = req.session.cart;
  var order = new Order(
    {
      cart: userCart,
      delivery: {
        address: delivery.address,
        name: delivery.name
      },
      user: req.user._id,
      orderDate: new Date()
    }
  );
  Order.create(order)
    .then(o => {
      req.session.cart = null;
      req.flash('success', 'Заказ оформлен.');
      res.redirect('/');
    })
    .catch(err => { });
});

module.exports = router;