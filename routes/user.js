var express = require('express');
var router = express.Router();
var passport = require('passport');
var moment = require('moment');
moment.locale('ru');
var mongoose = require('mongoose');
var Order = require('../models/order');

var csrf = require('csurf');
router.use(csrf());

/* GET profile page. */
router.get('/profile', isLoggedIn, function (req, res, next) {
    res.locals.title = 'Профиль - ' + res.locals.shopTitle;
    Order.find({
        user: req.user.id
    }).sort({_id: -1})
    .then(orders => {
        orders = orders.map(o => {
            o.date = moment(mongoose.Types.ObjectId(o._id).getTimestamp()).fromNow();
            return o;
        });
        res.locals.orders = orders;
        res.render('user/profile');
    })
});

/* GET logout. */
router.get('/logout', isLoggedIn, function(req, res, next) {
    req.logout();
    res.redirect('/');
});

router.use((req, res, next) => {
    res.redirect('/');
})

router.use('/', notLoggedIn, function(req, res, next) {
    next();
});

/* GET signup page. */
router.get('/signup', function (req, res, next) {
    var messages = req.flash('error');
    res.render('user/signup', {
        csrfToken: req.csrfToken(),
        messages: messages,
        hasErrors: messages.length > 0,
        title: 'Регистрация - Kalynovskyi & Co.'
    });
});

/* POST signup. */
router.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/user/profile',
    failureRedirect: '/user/signup',
    failureFlash: true
}));

/* GET signin page. */
router.get('/signin', function (req, res, next) {
    var messages = req.flash('error');
    res.render('user/signin', {
        csrfToken: req.csrfToken(),
        messages: messages,
        hasErrors: messages.length > 0,
        title: 'Войти - Kalynovskyi & Co.'
    });
});

/* POST signin. */
router.post('/signin', passport.authenticate('local-signin', {
    successRedirect: '/user/profile',
    failureRedirect: '/user/signin',
    failureFlash: true
}));

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.user) {
        return next();
    }
    res.redirect('/');
}

function notLoggedIn(req, res, next) {
    if (!req.user) {
        return next();
    }
    res.redirect('/');
}