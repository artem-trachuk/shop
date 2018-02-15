var express = require('express');
var router = express.Router();

var csrf = require('csurf');
router.use(csrf());

var Config = require('../models/config');
var Product = require('../models/product');
var Order = require('../models/order');
var Category = require('../models/category');
var ShippingField = require('../models/shipping-field');
var Guarantee = require('../models/guarantee');
var Field = require('../models/field');
var Almighty = require('../models/almighty');

router.use((req, res, next) => {
  if (req.user) {
    Almighty.findOne({
      user: req.user.id
    })
    .then(almightyUser => {
      if (almightyUser) {
        next();
      } else {
        req.flash('errors', 'У вас нет прав для доступа к панели управления.');
        res.redirect('/');
      }
    });
  } else {
    req.flash('errors', 'У вас нет прав для доступа к панели управления.');
    res.redirect('/');
  }
});

/* GET Admin page. */
router.get('/', function (req, res, next) {
  Config.findOne()
    .then(one => res.render('admin', {
      title: 'Панель управления - ' + one.title,
      shopTitle: one.title,
      USDtoUAH: one.USDtoUAH,
      address: one.address,
      description: one.description,
      phone: one.phone,
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

router.get('/order/:id', (req, res, next) => {
  Order.findById(req.params.id)
    .then(order => {
      res.locals.order = order;
      switch (order.status) {
        case 1:
          res.locals.status = 'Обрабатывается';
          break;
        case 2:
          res.locals.status = 'На складе';
          break;
        case 3:
          res.locals.status = 'Отправлен';
          break;
        case 4:
          res.locals.status = 'Получен';
          break;
        case 5:
          res.locals.status = 'Отказ';
          break;
      };
      var shippingFields = [];
      var done = 0;
      order.shippingFieldData.forEach(data => {
        ShippingField.findById(data.fieldId)
          .then(f => {
            shippingFields.push({
              name: f.name,
              data: data.fieldValue
            });
            done++;
            if (done === order.shippingFieldData.length) {
              res.locals.shippingFields = shippingFields;
              next();
            }
          });
      });
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
    clientNote: notes.clientNote
  }).then(updateResult => {
    res.redirect('/admin/order/' + req.params.id);
  });
});

router.post('/order/:id/status', (req, res, next) => {
  var updateOrder = {};
  updateOrder.status = parseInt(req.body.statusSelect);
  if (updateOrder.status === 4) {
    updateOrder.reciveDate = new Date();
  }
  Order.findByIdAndUpdate(req.params.id, updateOrder)
    .then(updateResult => {
      res.redirect('/admin/order/' + req.params.id);
    });
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
})

module.exports = router;