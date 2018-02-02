var passport = require('passport');
var User = require('./models/user');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('./shop-config');

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, res) {
        done(err, res);
    });
});

passport.use('fb-signin', new FacebookStrategy({
    clientID: config.clientID,
    clientSecret: config.clientSecret,
    callbackURL: config.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({
        fbId: profile.id
    }).then(user => {
        if (user) {
            return done(null, user);
        } else {
            User.create({
                displayName: profile.displayName,
                fbId: profile.id
            }).then(user => {
                return done(null, user);
            });
        }
    });
  }
));

passport.use('local-signup', new LocalStrategy({
    passReqToCallback: true
}, function (req, username, password, done) {
    User.findOne({
        username: username
    }, function (err, user) {
        if (err) {
            return done(err);
        }
        if (user) {
            return done(null, false, {
                message: 'Такой пользователь существует.'
            })
        }
        var newUser = new User();
        newUser.username = username;
        newUser.encryptPassword(password, function (err, hash) {
            if (err) {
                return done(err);
            }
            newUser.password = hash;
            newUser.save(function (err, res) {
                if (err) {
                    return done(err);
                }
                return done(null, newUser);
            });
        });
    });
}));

passport.use('local-signin', new LocalStrategy({
    passReqToCallback: true
}, function (req, username, password, done) {
    User.findOne({
        username: username
    }, function (err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false, {
                message: 'Такого пользователя не существует.'
            })
        }
        user.validPassword(password, function(err, res) {
            if (err || !res) {
                return done(null, false, 'Неверно введены данные.');
            }
            return done(null, user);
        });
    });
}));