var express = require('express');
var router = express.Router();

var csrf = require('csurf');
router.use(csrf());

var Product = require('../models/product');
var Config = require('../models/config');
var Category = require('../models/category');
var Field = require('../models/field');
var ProductData = require('../models/product-data');

var buildCategories = require('./helpers/buildCategories');

router.get('/:id', buildCategories, (req, res, next) => { // find all products in a category
    var categoryId = req.params.id;
    res.locals.categoryId = categoryId;
    var fields = req.query;
    const fieldsLength = Object.keys(fields).length;
    if (fieldsLength > 0) {
        var products = [];
        var done = 0;
        for (f in fields) {
            (function (field) {
                if (field === '_csrf') {
                    done++;
                } else {
                    ProductData.find({
                            fieldId: field,
                            fieldValue: fields[f]
                        })
                        .then(data => {
                            data.forEach(d => {
                                products.push(d.productId);
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
        Product.find({
                categories: {
                    $all: req.params.id
                }
            })
            .then(products => {
                res.locals.products = products;
                next();
            });
    }
}, (req, res, next) => { // find fields for filters
    var allFields = [];
    // recursive
    var findFields = function (categoryId) {
        Category.findById(categoryId)
            .then(category => {
                // has parent category
                if (category.parentCategoryId) {
                    // push to array curent category's fields
                    category.fields.forEach(field => {
                        allFields.push(field);
                    });
                    // find parenе category's fields
                    findFields(category.parentCategoryId);
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
                        for (var i = 0; i < fields.length; i++) {
                            (function (index) {
                                // get unique data values
                                ProductData.find({
                                        productId: {
                                            $in: res.locals.products
                                        },
                                        fieldId: fields[index].id
                                    })
                                    .then(data => {
                                        fields[index].data = data.filter((value, index, self) => index === self.findIndex((t) => (
                                            t.fieldValue === value.fieldValue
                                        )));
                                        if (index === fields.length - 1) {
                                            res.locals.fields = fields;
                                            next();
                                        }
                                    });
                            })(i);
                        };
                    });
                }
            });
    }
    findFields(req.params.id);
}, (req, res, next) => { // render page
    Config.findOne()
        .then(conf => {
            res.render('category', {
                title: 'category',
                exchangeRate: conf.USDtoUAH,
                csrfToken: req.csrfToken()
            });
        });
});

router.post('/', (req, res, next) => {
    res.render('category', {
        title: 'category',
        csrfToken: req.csrfToken()
    });
});

module.exports = router;