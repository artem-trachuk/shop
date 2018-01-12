var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

userSchema.methods.encryptPassword = function (password, cb) {
    var saltRounds = 6;
    bcrypt.hash(password, saltRounds, function (err, hash) {
        cb(err, hash);
    });
};

userSchema.methods.validPassword = function (password, cb) {
    bcrypt.compare(password, this.password, function (err, res) {
        cb(err, res);
    });
}

module.exports = mongoose.model('User', userSchema);