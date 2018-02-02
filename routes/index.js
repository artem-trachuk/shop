var express = require('express');
var router = express.Router();
var passport = require('passport');

var csrf = require('csurf');
router.use(csrf());

var Product = require('../models/product');
var Config = require('../models/config');
var Order = require('../models/order');
var Category = require('../models/category');
var ProductData = require('../models/product-data');
var Field = require('../models/field');
var User = require('../models/user');

var buildCategories = require('./helpers/buildCategories');

/* GET home page. */
router.get('/', function (req, res, next) {
  // find all products which have at least one category
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
    .catch(err => {
      req.flash('errors', 'Не удалось загрузить список продуктов.');
      next();
    });
}, buildCategories, (req, res, next) => {
  req.session.callbackUrl = '/';
  res.locals.title = res.locals.shopTitle + ' - магазин сетевого оборудования от специалистов, которые с ним работают';
  res.render('index');
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
      res.render('index');
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

module.exports = router;