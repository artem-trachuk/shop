var shopConfig = require('./shop-config');
var mongoose = require('mongoose');
var compression = require('compression');
var express = require('express');
var helmet = require('helmet');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var hbs = require('hbs');
var session = require('express-session');
const MongoStore = require('connect-mongo')(session);
var passport = require('passport');
var flash = require('connect-flash');

var Config = require('./models/config');
var User = require('./models/user');
var Counter = require('./models/counter');
var Review = require('./models/review');

var index = require('./routes/index');
var category = require('./routes/category');
var cart = require('./routes/cart');
var admin = require('./routes/admin');
var user = require('./routes/user');
var product = require('./routes/admin/product');
var adminCategory = require('./routes/admin/category');
var shippingAndPayment = require('./routes/admin/shipping-and-payment');
var shipping = require('./routes/admin/shipping');
var payment = require('./routes/admin/payment');
var deleteData = require('./routes/admin/delete');
var infotechParser = require('./routes/admin/parser');

mongoose.connect(shopConfig.mongodburl)
  .catch(err => console.log(err));
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log(`Connection to MongoDB was established.`);
});

var app = express();

app.use(compression());

app.use(helmet());

require('./passport-config');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// register hbs partials
hbs.registerPartials(__dirname + '/views/partials');
hbs.registerPartials(__dirname + '/views/partials/admin');

// register hbs helper
hbs.registerHelper('showDate', function (date) {
  return date.toDateString();
});

// register hbs helper (show selected category in select list of admin/category page)
hbs.registerHelper('optionHelper', (selectedValue, selectValue) => {
  if (selectedValue === selectValue) return 'selected';
  return;
});

// register hbs helper (show selected filters)
hbs.registerHelper('filterSelected', (query, name, fieldvalue) => {
  if (Object.keys(query).length > 0 && query[name]) {
    if (query[name].indexOf(fieldvalue) > -1) {
      return 'checked';
    }
  }
});

hbs.registerHelper('statusSwitch', (status) => {
  switch (status) {
    case 0:
      return 'Отправлено на рассмотрение';
      break;
    case 1:
      return 'Обрабатывается';
      break;
    case 2:
      return 'На складе';
      break;
    case 3:
      return 'Отправлен';
      break;
    case 4:
      return 'Получен';
      break;
    case 5:
      return 'Отказ';
      break;
  }
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(session({
  secret: shopConfig.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 28 // 28 days
  },
  store: new MongoStore({
    mongooseConnection: db
  })
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
// static path to uploaded files
app.use('/uploads/', express.static('uploads'));

// load total quantity from session (if not auth) or mongo then save to res.locals
app.use(function (req, res, next) {
  if (req.user) {
    res.locals.profile = req.user;
    User.findById(req.user.id)
      .then(user => {
        if (user.cart) {
          res.locals.totalQty = user.cart.totalQty;
        }
        next();
      });
  } else if (req.session.cart) {
    res.locals.totalQty = req.session.cart.totalQty;
    next();
  } else {
    next();
  }
});

// load footer data
app.get('*', (req, res, next) => {
  Config.findOne()
    .then(conf => {
      res.locals.shopTitle = conf.title;
      res.locals.shopDescription = conf.description;
      res.locals.shopAddress = conf.address;
      res.locals.shopNumber = conf.phone;
      next();
    });
});

// load flash errors & success messages
app.get('*', (req, res, next) => {
  res.locals.errors = req.flash('errors');
  res.locals.success = req.flash('success');
  next();
});

app.use('/', index);
app.use('/category', category);
app.use('/cart', cart);
app.use('/user', user);
app.use('/admin', (req, res, next) => {
  Review.count({ checked: false })
    .then(counter => {
      res.locals.reviewsCounter = counter;
      next();
    })
    .catch(err => next(err));
})
app.use('/admin', admin);
app.use('/admin/product', product);
app.use('/admin/category', adminCategory);
app.use('/admin/shipping', shipping);
app.use('/admin/payment', payment);
app.use('/admin/shipping-and-payment', shippingAndPayment);
app.use('/admin/delete', deleteData);
app.use('/admin/parser', infotechParser)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.locals.title = 'Ой... - ' + res.locals.shopTitle;
  res.render('error');
});

// initiate config if not exist
Config.findOne(function (err, doc) {
  if (err) {
    console.log('err ' + err);
  }
  if (doc === null) {
    conf = new Config();
    conf.save(function (err, res) {
      if (err) {
        return console.log(err);
      }
    })
  }
});

Counter.findOne()
  .then(counter => {
    if (!counter) {
      Counter.create({});
    }
  });

module.exports = app;