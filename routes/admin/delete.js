var express = require('express');
var router = express.Router();

var csrf = require('csurf');
router.use(csrf());

var Category = require('../../models/category');
var Product = require('../../models/product');

router.get('/category/:id', function (req, res, next) {
    req.flash('errors', 'Функция удаления пока что недоступна.')
    res.redirect('/admin/category/' + req.params.id);
});

/* DELETE Product. */
router.get('/product/:id', function (req, res, next) {
    productId = req.params.id;
    Product.findOneAndRemove({
            _id: productId
        })
        .then(removeRes => res.redirect('/admin/products'))
        .catch(err => console.log(err));
});

module.exports = router;