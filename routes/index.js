var express = require('express');
var router = express.Router();
var passport = require('passport');

var Review = require('../models/review');
router.post('/review', (req, res, next) => {
  if (req.user) {
    console.log(req.body.review);
    Review.create({
        user: req.user,
        review: req.body.review,
        date: Date.now()
      }).then(createrResult => {
        res.sendStatus(200);
      })
      .catch(err => next(err));
  } else {
    res.sendStatus(403);
  }
});

var csrf = require('csurf');
router.use(csrf());

var Product = require('../models/product');
var Config = require('../models/config');
var Order = require('../models/order');
var Category = require('../models/category');
var Field = require('../models/field');
var User = require('../models/user');
var Shipping = require('../models/shipping');
var Payment = require('../models/payment');

var buildCategories = require('./helpers/buildCategories');

/* GET home page. */
router.get('/', (req, res, next) => {
  Config.findOne().then(config => {
    res.locals.productsPerPage = config.productsPerPage;
    next();
  }).catch(err => next(err));
}, function (req, res, next) {
  // find all products which have at least one category
  var page = req.query.page ? parseInt(req.query.page) : 1;
  var search = req.query.search;
  if (search) {
    Product.find({
      title: {
        $regex: new RegExp( '.*' + search + '.*'),
        $options: 'i'
      }
    })
    .then(products => {
      res.locals.products = products;
      res.locals.disablePagination = true;
      next();
    })
    .catch(err => next(err));
  } else {
    Product.find().sort({
      _id: -1
    }).skip(res.locals.productsPerPage * (page - 1)).limit(res.locals.productsPerPage)
    .then(products => {
      res.locals.products = products;
      next();
    })
    .catch(err => next(err));
  }
}, buildCategories, (req, res, next) => {
  Product.count().then(count => {
    var page = req.query.page ? parseInt(req.query.page) : 1;
    req.session.callbackUrl = '/';
    res.locals.title = page > 1 ? 'Страница ' + page + ' - ' + res.locals.shopTitle : res.locals.shopTitle;
    require('./helpers/buildPagination')(res.locals, page, count, res.locals.productsPerPage);
    res.render('index');
  }).catch(err => next(err));
});

/* GET Products by Search query */
router.get('/search', (req, res, next) => {
  var query = req.query.q;
  Product.find({
      title: {
        $regex: new RegExp( '.*' + query + '.*'),
        $options: 'i'
      }
    })
    .then(products => {
      res.locals.products = products;
      res.render('index');
    })
    .catch(err => next(err));
});

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
      res.locals.product = product;
      res.locals.title = product.title + ' - ' + res.locals.shopTitle;
      var done = 0;
      var dataArray = [];
      if (product.data.length === 0) {
        next();
      }
      product.data.forEach(data => {
        Field.findById(data.field)
          .then(field => {
            done++;
            dataArray.push({
              name: field.name,
              value: data.fieldValue
            });
            if (done == product.data.length) {
              res.locals.fields = dataArray.sort(function (a, b) {
                var nameA = a.name.toUpperCase(); // ignore upper and lowercase
                var nameB = b.name.toUpperCase(); // ignore upper and lowercase
                if (nameA < nameB) {
                  return -1;
                }
                if (nameA > nameB) {
                  return 1;
                }

                // names must be equal
                return 0;
              });
              next();
            }
          })
          .catch(err => next(err));
      });
    })
    .catch(err => next(err));
}, (req, res, next) => {
  res.render('product');
});

router.get('/fb-login', passport.authenticate('fb-signin'));

router.get('/fb-callback', passport.authenticate('fb-signin', {
  failureRedirect: '/',
}), (req, res, next) => {
  if (req.session.cart) {
    User.findByIdAndUpdate(req.user.id, {
        cart: req.session.cart,
      }).then(updateResult => {
        req.session.cart = null;
        next();
      })
      .catch(err => {
        next();
      });
  } else {
    next();
  }
}, (req, res, next) => {
  if (req.session.orders) {
    var done = 0;
    var orders = req.session.orders;
    orders.forEach(order => {
      Order.findByIdAndUpdate(order, {
          user: req.user.id
        })
        .then(updRes => {
          done++;
          if (done === orders.length) {
            req.session.orders = null;
            next();
          }
        })
        .catch(err => {
          //
        });
    });
  } else {
    next();
  }
}, (req, res, next) => {
  res.redirect('/');
});

router.get('/shipping-and-payment', (req, res, next) => {
  Shipping.find({
      show: true
    })
    .then(allShipping => {
      res.locals.shipping = allShipping;
      next();
    })
    .catch(err => next(err));
}, (req, res, next) => {
  Payment.find({
      show: true
    })
    .then(allPayment => {
      res.locals.payment = allPayment;
      next();
    })
    .catch(err => next(err));
}, (req, res, next) => {
  res.locals.title = 'Способы доставки и оплаты - ' + res.locals.shopTitle;
  res.render('shipping-and-payment');
});

module.exports = router;