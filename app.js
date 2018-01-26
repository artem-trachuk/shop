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

var index = require('./routes/index');
var category = require('./routes/category');
var admin = require('./routes/admin');
var user = require('./routes/user');
var product = require('./routes/admin/product');
var adminCategory = require('./routes/admin/category');
var deleteData = require('./routes/admin/delete');

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

// register hbs helper to calculate price
hbs.registerHelper('getUAHprice', function (usdprice, rate) {
  return (usdprice * rate).toFixed(0);
});

// register hbs helper
hbs.registerHelper('optionHelper', (selectedValue, selectValue) => {
  if (selectedValue === selectValue) return 'selected';
  return;
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

// save authenticate status and session to global variables
app.use(function (req, res, next) {
  res.locals.login = req.isAuthenticated();
  res.locals.session = req.session;
  next();
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

app.use('/', index);
app.use('/category', category);
app.use('/user', user);
app.use('/admin', admin);
app.use('/admin/product', product);
app.use('/admin/category', adminCategory);
app.use('/admin/delete', deleteData);

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

module.exports = app;