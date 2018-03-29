var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var reviews = require('./reviews');
var orders = require('./orders');
var moment = require('moment');
moment.locale('ru');

var csrf = require('csurf');
router.use(csrf());

var Config = require('../../models/config');
var Product = require('../../models/product');
var Order = require('../../models/order');
var Category = require('../../models/category');
var Guarantee = require('../../models/guarantee');
var Field = require('../../models/field');
var Admin = require('../../models/admin');
var Review = require('../../models/review');
var OrderState = require('../../models/orderState');

router.use((req, res, next) => {
  // return next();
  var noAccess = function () {
    req.flash('errors', 'У вас нет прав для доступа к панели управления.');
    res.redirect('/');
  }
  if (req.user) {
    Admin.findOne({
        user: req.user.id
      })
      .then(admin => {
        if (admin) {
          next();
        } else {
          noAccess();
        }
      })
      .catch(err => next(err));
  } else {
    noAccess();
  }
});

router.use((req, res, next) => {
  Order.find({
      state: {
        $exists: false
      }
    }).count().then(orders => {
      res.locals.ordersCount = orders;
      next();
    })
    .catch(err => next(err));
});

router.get('/', (req, res, next) => {
  res.redirect('/admin/home');
});

router.use('/reviews', reviews);
router.use('/orders', orders);

/* GET Admin page. */
router.get('/config', function (req, res, next) {
  Config.findOne()
    .then(one => res.render('admin/config', {
      title: 'Панель управления - ' + one.title,
      shopTitle: one.title,
      address: one.address,
      description: one.description,
      phones: one.phones,
      configMenu: true,
      productsPerPage: one.productsPerPage,
      csrfToken: req.csrfToken()
    }))
    .catch(err => next(err));
});

router.post('/phones', (req, res, next) => {
  var phone = req.body.phone;
  Config.findOneAndUpdate({}, {
    $push: {
      phones: {
        phone: phone
      }
    }
  }).then(updResult => {
    res.redirect('/admin/config');
  }).catch(err => next(err));
});

router.post('/phones/:id', (req, res, next) => {
  var phone = req.body.phone;
  if (phone.length === 0) {
    Config.findOneAndUpdate({}, {
      $pull: {
        phones: {
          _id: req.params.id
        }
      }
    }).then(remResult => {
      next();
    }).catch(err => next(err));
  } else {
    Config.findOneAndUpdate({
      'phones._id': req.params.id
    }, {
      $set: {
        'phones.$.phone': phone
      }
    }).then(updResult => {
      next();
    }).catch(err => next(err));
  }
}, (req, res, next) => {
  res.redirect('/admin/config');
});

/* POST admin. */
router.post('/', function (req, res, next) {
  conf = req.body;
  Config.findOne()
    .then(one => {
      one.title = conf.shopTitle;
      one.address = conf.address;
      one.description = conf.description;
      one.phone = conf.phone;
      one.productsPerPage = conf.productsPerPage;
      one.save()
        .then(savedOne => res.redirect('/admin/config'))
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

router.get('/order/:id', (req, res, next) => {
  OrderState.find().then(states => {
    res.locals.states = states;
    next();
  }).catch(err => next(err));
}, (req, res, next) => {
  Order.findById(req.params.id)
    .then(order => {
      res.locals.order = order;
      order.date = moment(mongoose.Types.ObjectId(order._id).getTimestamp()).calendar();
      next();
    });
}, (req, res, next) => {
  Guarantee.find({
      order: req.params.id
    })
    .then(guarantees => {
      if (guarantees.length > 0) {
        res.locals.guarantees = guarantees;
      }
      next();
    });
}, (req, res, next) => {
  res.locals.title = 'Панель управления / Заказы / ' + req.params.id + ' - ' + res.locals.shopTitle;
  res.render('admin/order', {
    csrfToken: req.csrfToken()
  });
});

router.post('/order/:id/notes', (req, res, next) => {
  const notes = req.body;
  Order.findByIdAndUpdate(req.params.id, {
    workingNote: notes.workingNote,
    noteForClient: notes.noteForClient
  }).then(updateResult => {
    res.redirect('/admin/order/' + req.params.id);
  });
});

router.post('/order/:id/state', (req, res, next) => {
  var state = req.body.state;
  Order.findByIdAndUpdate(req.params.id, {
    state: state
  }).then(updResult => {
    res.redirect('/admin/order/' + req.params.id);
  }).catch(err => next(err));
});

router.post('/guarantees', (req, res, next) => {
  Guarantee.create(req.body)
    .then(createResult => {
      res.redirect('/admin/order/' + createResult.order);
    });
});

/* GET Admin Products page. */
router.get('/products', function (req, res, next) {
  res.locals.title = 'Панель управления / Продукты - ' + res.locals.shopTitle;
  Product.find()
    .then(docs => res.render('admin/products', {
      products: docs,
      productsMenu: true
    }))
    .catch(err => res.redirect('/'));
});

/* GET Admin Categories page. */
router.get('/categories', function (req, res, next) {
  res.locals.title = 'Панель управления / Категории - ' + res.locals.shopTitle;
  Category.find({})
    .then(categories => res.render('admin/categories', {
      categories: categories,
      categoriesMenu: true
    }))
    .catch(err => console.log(err));
});

router.get('/fields', (req, res, next) => {
  res.locals.title = 'Панель управления / Поля - ' + res.locals.shopTitle;
  Field.find()
    .then(fields => {
      res.locals.fields = fields;
      res.render('admin/fields', {
        fieldsMenu: true,
        csrfToken: req.csrfToken()
      });
    })
    .catch(err => {
      req.flash('errors', 'Не удалось получить доступ к полям.');
      res.redirect('/admin');
    });
});

router.post('/field/:id', (req, res, next) => {
  Field.findByIdAndUpdate(req.params.id, {
      name: req.body.fieldName
    })
    .then(updRes => {
      res.redirect('/admin/fields');
    })
    .catch(err => {
      req.flash('errors', 'Не удалось обновить данные.');
      res.redirect('/admin/fields');
    })
});

router.get('/guarantees', (req, res, next) => {
  Guarantee.find()
    .then(guarantees => {
      res.locals.guarantees = guarantees;
      next();
    })
    .catch(err => next(err));

}, (req, res, next) => {
  res.render('admin/guarantees', {
    guaranteesMenu: true
  });
});

router.post('/order/:orderId/guarantee/:guaranteeId', (req, res, next) => {
  Guarantee.findByIdAndUpdate(req.params.guaranteeId, {
      serial: req.body.serial
    })
    .then(updateResult => {
      res.redirect('/admin/order/' + req.params.orderId);
    })
    .catch(err => next(err));
});

router.get('/home', (req, res, next) => {
  Order.find({
      status: {
        $exists: false
      }
    }).count().then(orders => {
      res.locals.title = 'Панель управления / Состояние - ' + res.locals.shopTitle;
      res.render('admin/home', {
        homeMenu: true
      });
    })
    .catch(err => next(err));
});

module.exports = router;