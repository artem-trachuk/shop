var express = require('express');
var router = express.Router();

var csrf = require('csurf');
router.use(csrf());

var Category = require('../../models/category');
var Product = require('../../models/product');
var ProductData = require('../../models/product-data');

router.get('/category/:id', function (req, res, next) {
    const categoryId = req.params.id;
    Product.find({
        categories: {
            $all: categoryId
        }
    }).then(products => {
        if (products.length > 0) {
            req.flash('errors', 'В данной категории есть продукты, удаление невозможно.');
            res.redirect('/admin/category/' + categoryId);
        } else {
            Category.findByIdAndRemove(categoryId)
            .then(remRes => {
                req.flash('success', 'Категория удалена.');
                return Category.update({
                    parentCategoryId: categoryId
                }, {
                    $unset: {
                        parentCategoryId: ""
                    }
                });
            })
            .then(remRes => {
                res.redirect('/admin/categories');
            });
        }
    });
});

// удалить категорию удалить поле удалить продукт удалить данные продукта

/* DELETE Product. */
router.get('/product/:id', function (req, res, next) {
    productId = req.params.id;
    Product.findOneAndRemove({
            _id: productId
        })
        .then(removeRes => {
            return ProductData.remove({
                productId: productId
            })
        })
        .then(remRes => {
            res.redirect('/admin/products');
        })
        .catch(err => console.log(err));
});

module.exports = router;