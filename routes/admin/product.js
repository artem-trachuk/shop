var express = require('express');
var router = express.Router();
var multer = require('multer');
var conf = require('../../shop-config');
var upload = multer({
    dest: conf.dest
});

var csrf = require('csurf');
router.use(csrf());

var Product = require('../../models/product');
var Category = require('../../models/category');
var Field = require('../../models/field');
var ProductData = require('../../models/product-data');
var Counter = require('../../models/counter');

/* GET Admin product editor. */
router.get('/', function (req, res, next) {
    Category.find()
        .then(categories => {
            // Disable product creation cause of no categories
            if (categories.length === 0) {
                req.flash('errors', 'Для добавления продукта необходима хотя бы одна категория.');
                res.redirect('/admin/category');
            } else {
                res.render('admin/product', {
                    categories: categories,
                    csrfToken: req.csrfToken()
                });
            }
        });
});

/* POST Admin product. */
router.post('/', upload.single('productImage'), function (req, res, next) {
    product = req.body;
    if (!Number.isInteger(parseInt(product.price))) {
        req.flash('errors', 'Необходимо указать стоимость.');
        return res.redirect('/admin/product');
    }
    Counter.findOneAndUpdate({
        $inc: {
            product: 1
        }
    })
    .then(counter => {
        Product.create({
            title: product.title,
            price: product.price,
            article: counter.product,
            USDprice: product.USDprice,
            description: product.description
        })
        .then(insertRes => {
            if (req.file) {
                insertRes.imagePath = '/uploads/' + req.file.filename;
            }
            insertRes.save().then(saveRes => {
                req.flash('success', 'Продукт ' + insertRes.title + ' успешно создан. Вы можете перейти к настройке полей.');
                res.redirect('/admin/product/' + insertRes.id);
            });
        })
        .catch(err => console.log(err));
    })
});

/* GET Admin product editor by id. */
router.get('/:id', function (req, res, next) {
    productId = req.params.id;
    var errors = req.flash('errors');
    var success = req.flash('success');
    Product.findById(productId)
        .then(doc => {
            res.render('admin/product', {
                product: doc,
                errors: errors,
                success: success,
                csrfToken: req.csrfToken()
            });
        })
        .catch(err => res.redirect('/'));
});

/* POST Admin product by id. */
router.post('/:id', upload.single('productImage'), function (req, res, next) {
    productId = req.params.id;
    product = req.body;
    if (!Number.isInteger(parseInt(product.USDprice)) && !Number.isInteger(parseInt(product.price))) {
        req.flash('errors', 'Необходимо указать стоимость.');
        return res.redirect('/admin/product/' + productId);
    }
    Product.findById(productId)
        .then(doc => {
            doc.title = product.title;
            doc.price = product.price;
            doc.USDprice = product.USDprice;
            doc.description = product.description;
            if (req.file) {
                doc.imagePath = '/uploads/' + req.file.filename;
            }
            doc.save()
                .then(res.redirect('/admin/product/' + productId));
        })
        .catch(err => res.redirect('/'));
});

/* GET Admin Product Data page. */
router.get('/:id/data', (req, res, next) => {
    var productId = req.params.id;
    var errors = req.flash('errors');
    var success = req.flash('success');
    // find all categories
    Category.find()
        .then(categories => {
            if (categories.length > 0) {
                // find requested product
                Product.findById(productId)
                    .then(product => {
                        if (product) {
                            // find product's categories
                            Category.find({
                                    _id: {
                                        $in: product.categories
                                    }
                                })
                                .then(productCategories => {
                                    if (productCategories.length === 0) {
                                        // render page
                                        return res.render('admin/product-data', {
                                            errors: errors,
                                            success: success,
                                            categories: categories,
                                            product: product,
                                            csrfToken: req.csrfToken()
                                        });
                                    }
                                    var categoriesDone = 0;
                                    var resultFields = [];
                                    // find fields for each product's category
                                    productCategories.forEach(productCategory => {
                                        Field.find({
                                                _id: {
                                                    $in: productCategory.fields
                                                }
                                            })
                                            .then(fields => {
                                                if (fields.length > 0) {
                                                    ProductData.find({
                                                            fieldId: {
                                                                $in: fields
                                                            },
                                                            productId: productId
                                                        })
                                                        .then(productData => {
                                                            fields.forEach(field => {
                                                                resultFields.push({
                                                                    _id: field.id,
                                                                    name: field.name
                                                                })
                                                            });
                                                            var done = 0;
                                                            productData.forEach(data => {
                                                                var t = resultFields.find(f => f._id === data.fieldId.toString());
                                                                t.fieldValue = data.fieldValue;
                                                            });
                                                            categoriesDone++;
                                                            if (categoriesDone === productCategories.length) {
                                                                // render page
                                                                res.render('admin/product-data', {
                                                                    errors: errors,
                                                                    success: success,
                                                                    categories: categories,
                                                                    product: product,
                                                                    productCategories: productCategories,
                                                                    fields: resultFields,
                                                                    csrfToken: req.csrfToken()
                                                                });
                                                            }
                                                        })
                                                        .catch(err => {
                                                            req.flash('errors', 'Произошла ошибка');
                                                            res.redirect('/admin/product/' + productId);
                                                        });
                                                } else {
                                                    categoriesDone++;
                                                    if (categoriesDone === productCategories.length) {
                                                        // render page
                                                        res.render('admin/product-data', {
                                                            errors: errors,
                                                            success: success,
                                                            categories: categories,
                                                            product: product,
                                                            fields: resultFields,
                                                            productCategories: productCategories,
                                                            csrfToken: req.csrfToken()
                                                        });
                                                    }
                                                }
                                            })
                                            .catch(err => {
                                                req.flash('errors', 'Произошла ошибка');
                                                res.redirect('/admin/product/' + productId);
                                            });
                                    });
                                })
                                .catch(err => {
                                    req.flash('errors', 'Произошла ошибка');
                                    res.redirect('/admin/product/' + productId);
                                });
                        } else {
                            req.flash('errors', 'Не удалось найти продукт.');
                            res.redirect('/admin/products/');
                        }
                    })
                    .catch(err => {
                        req.flash('errors', 'Не удалось найти продукт.');
                        res.redirect('/admin/products/');
                    });
            } else {
                req.flash('errors', 'Необходимо создать хотя бы одну категорию.');
                res.redirect('/admin/category/');
            }
        })
        .catch(err => {
            req.flash('errors', 'Не удалось выполнить запрос');
            res.redirect('/admin/product/' + productId);
        });
});

router.post('/:id/add-category', (req, res, next) => {
    var productId = req.params.id;
    var formData = req.body;
    Product.findById(productId)
        .then(product => {
            if (product) {
                // recursive function
                var addCategory = function (categorId) {
                    Category.findById(categorId)
                        .then(category => {
                            if (category) {
                                product.categories.push(category.id);
                                if (category.parentCategoryId) {
                                    addCategory(category.parentCategoryId);
                                } else {
                                    product.save()
                                        .then(save => res.redirect('/admin/product/' + productId + '/data'));
                                }
                            }
                        });
                };
                addCategory(formData.categorySelect);
            }

        })
        .catch(err => {
            req.flash('errors', 'Не удалось выполнить запрос.');
            res.redirect('/admin/product/' + productId + '/data');
        });
});

/* POST Admin Product data. */
router.post('/:id/data', function (req, res, next) {
    var productId = req.params.id;
    var fields = req.body;
    fieldsLength = Object.keys(fields).length;
    var done = 0;
    for (f in fields) {
        (function (field) {
            if (field === '_csrf') {
                done++;
            } else {
                var f = field;
                if (fields[f].length === 0) {
                    done++;
                    if (done === fieldsLength) next();
                } else {
                    ProductData.findOneAndUpdate({
                        productId: productId,
                        fieldId: f
                    }, {
                        fieldValue: fields[f]
                    })
                    .then(ou => {
                        // No data
                        if (!ou) {
                            ProductData.create({
                                    productId: productId,
                                    fieldId: f,
                                    fieldValue: fields[f]
                                })
                                .then(createResult => {
                                    done++;
                                    if (done === fieldsLength) next();
                                });
                        } else {
                            done++;
                            if (done === fieldsLength) next();
                        }
                    })
                    .catch(err => console.log(err));
                }
            }
        })(f);
    }
}, renderProductDataUpdate);

function renderProductDataUpdate(req, res, next) {
    productId = req.params.id;
    res.redirect('/admin/product/' + productId + '/data');
}

module.exports = router;