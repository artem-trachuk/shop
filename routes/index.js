var express = require('express');
var router = express.Router();

var csrf = require('csurf');
router.use(csrf());

var Product = require('../models/product');
var Cart = require('../models/cart');
var Config = require('../models/config');
var Order = require('../models/order');
var Category = require('../models/category');
var ProductData = require('../models/product-data');
var Field = require('../models/field');

var buildCategories = require('./helpers/buildCategories');

/* GET home page. */
router.get('/', function (req, res, next) {
  Product.find({
      categories: {
        $not: {
          $size: 0
        }
      }
    })
    .then(products => {
      res.locals.products = products;
      next();
    })
    .catch(err => console.log(err));
}, buildCategories, (req, res, next) => {
  var messages = req.flash('messages');
  Config.findOne()
    .then(conf => {
      res.render('index', {
        title: conf.title + ' - магазин сетевого оборудования от специалистов, которые с ним работают',
        messages: messages,
        exchangeRate: conf.USDtoUAH,
        csrfToken: req.csrfToken()
      });
    })
    .catch(err => console.log(err));
});

router.post('/', (req, res, next) => {

});

/* GET Products by Search query */
router.get('/search', (req, res, next) => {
  query = req.query.q;
  Product.find({
      title: {
        $regex: '.*' + query + '.*'
      }
    })
    .then(products => {
      res.locals.products = products;
      next();
    })
})

/* GET Product page. */
router.get('/product/:id', (req, res, next) => {
  Config.findOne()
    .then(conf => {
      res.locals.exchangeRate = conf.USDtoUAH;
      next();
    });
}, buildCategories, function (req, res, next) {
  var productId = req.params.id;
  Product.findById(productId)
    .then(product => {
      ProductData.find({
          productId: productId
        })
        .then(data => {
          var done = 0;
          var dataArray = [];
          data.forEach(dataElement => {
            Field.findById(dataElement.fieldId)
              .then(f => {
                done++;
                dataArray.push({
                  name: f.name,
                  value: dataElement.fieldValue
                });
                if (done === data.length) {
                  res.render('product', {
                    product: product,
                    fields: dataArray
                  });
                }
              });
          });
        });
    });
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
    cart.add(product, product.id)
      .then(() => {
        // Save cart into session
        req.session.cart = cart;
        res.redirect('/');
      });
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
    totalPrice: cart.totalPrice.toFixed(0),
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
  var order = new Order({
    cart: userCart,
    delivery: {
      address: delivery.address,
      name: delivery.name
    },
    user: req.user._id,
    orderDate: new Date()
  });
  Order.create(order)
    .then(o => {
      req.session.cart = null;
      req.flash('success', 'Заказ оформлен.');
      res.redirect('/');
    })
    .catch(err => {});
});

module.exports = router;