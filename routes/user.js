var express = require('express');
var router = express.Router();
var passport = require('passport');

var csrf = require('csurf');
router.use(csrf());

/* GET profile page. */
router.get('/profile', isLoggedIn, function (req, res, next) {
    res.render('user/profile');
});

/* GET logout. */
router.get('/logout', isLoggedIn, function(req, res, next) {
    req.logout();
    res.redirect('/');
});

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