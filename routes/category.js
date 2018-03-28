var express = require('express');
var router = express.Router();

var csrf = require('csurf');
router.use(csrf());

var Product = require('../models/product');
var Config = require('../models/config');
var Category = require('../models/category');
var Field = require('../models/field');

var buildCategories = require('./helpers/buildCategories');

router.get('/:id', buildCategories, (req, res, next) => { // find all products in a category
    var categoryId = req.params.id;
    res.locals.categoryId = req.params.id;
    var fields = res.locals.query = req.query;
    const fieldsLength = Object.keys(fields).length;
    // find products with filters
    if ((fieldsLength > 0 && !fields['page']) || (fieldsLength > 1 && fields['page'])) {
        var products = [];
        var done = 0;
        for (f in fields) {
            (function (field) {
                if (field === '_csrf' || field == 'page') {
                    done++;
                } else {
                    Product.find({
                            "data.field": field,
                            "data.fieldValue": fields[f]
                        })
                        .then(p => {
                            p.forEach(d => {
                                products.push(d.id);
                            });
                            done++;
                            if (done === fieldsLength) {
                                Product.find({
                                        _id: {
                                            $in: products
                                        },
                                        categories: {
                                            $all: categoryId
                                        }
                                    })
                                    .then(allProducts => {
                                        res.locals.products = allProducts;
                                        next();
                                    })
                            }
                        });
                }
            })(f);
        }
    } else {
        // find all products in category
        Product.find({
                categories: {
                    $all: req.params.id
                }
            })
            .then(products => {
                res.locals.products = products;
                next();
            })
            .catch(err => {
                next();
            });
    }
}, (req, res, next) => {
    Product.find({
            categories: {
                $all: req.params.id
            }
        })
        .then(products => {
            res.locals.allProducts = products;
            res.locals.count = products.length;
            next();
        })
        .catch(err => {
            next();
        });
}, (req, res, next) => { // find fields for filters
    var allFields = [];
    // recursive
    var findFields = function (categoryId) {
        Category.findById(categoryId)
            .then(category => {
                res.locals.categoryName = category.name;
                // has parent category
                if (category.parentCategory) {
                    // push to array curent category's fields
                    category.fields.forEach(field => {
                        allFields.push(field);
                    });
                    // find parent category's fields
                    findFields(category.parentCategory);
                } else {
                    // push to array curent category's fields
                    category.fields.forEach(field => {
                        allFields.push(field);
                    });
                    // find all fields for category and parent categories
                    Field.find({
                            _id: {
                                $in: allFields
                            }
                        }).then(fields => {
                            if (fields.length === 0) {
                                return next();
                            }
                            const products = res.locals.allProducts;
                            var fieldsForView = [];
                            for (var i = 0; i < fields.length; i++) {
                                (function (index) {
                                    var values = [];
                                    products.forEach(product => {
                                        product.data.forEach(data => {
                                            if (data.field.toString() === fields[index].id) {
                                                if (!values.find(v => v.fieldValue === data.fieldValue)) {
                                                    values.push({
                                                        fieldValue: data.fieldValue,
                                                        fieldId: fields[index].id
                                                    });
                                                }
                                            }
                                        });
                                    });
                                    if (values.length > 0) {
                                        fieldsForView.push({
                                            id: fields[index].id,
                                            name: fields[index].name,
                                            data: values
                                        });
                                    }
                                    // fields[index].data = values;
                                    if (index === fields.length - 1) {
                                        if (fieldsForView.length > 0) {
                                            res.locals.fields = fieldsForView;
                                        }
                                        next();
                                    }
                                })(i);
                            };
                        })
                        .catch(err => {
                            //
                        });
                }
            });
    }
    findFields(req.params.id);
}, (req, res, next) => {
    Config.findOne().then(config => {
      res.locals.productsPerPage = config.productsPerPage;
      next();
    }).catch(err => next(err));
  }, (req, res, next) => { // render page
    Category.findById(req.params.id)
        .then(category => {
            var query = res.locals.query;
            res.locals.navString = ''
            for (q in query) {
                if (q !== 'page') {
                    if (Array.isArray(query[q])) {
                        query[q].forEach(qElem => {
                            res.locals.navString += '&' + q + '=' + qElem;
                        });
                    } else {
                        res.locals.navString += '&' + q + '=' + query[q];
                    }
                }
            }
            var page = req.query.page ? parseInt(req.query.page) : 1;
            var length = res.locals.products.length;
            res.locals.products = res.locals.products.slice((res.locals.productsPerPage * (page - 1)), (res.locals.productsPerPage * page));
            require('./helpers/buildPagination')(res.locals, page, length, res.locals.productsPerPage);
            res.locals.title = category.name + ' - ' + res.locals.shopTitle;
            res.render('index');
        })
        .catch(err => {
            req.flash('errors', 'Не удалось выполнить запрос.');
            res.redirect('/');
        });
});

module.exports = router;