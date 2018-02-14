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
    Product.findById(productId)
        .then(doc => {
            res.render('admin/product', {
                product: doc,
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
    Category.find()
        .then(categories => {
            if (categories.length === 0) {
                req.flash('errors', 'Необходимо создать хотя бы одну категорию.');
                return res.redirect('/admin/category/');
            }
            res.locals.categories = categories;
            next();
        })
        .catch(err => next(err));
}, (req, res, next) => {
    Product.findById(req.params.id)
        .then(product => {
            if (product) {
                res.locals.title = product.title;
                res.locals.product = product;
                Category.find({
                        _id: {
                            $in: product.categories
                        }
                    })
                    .then(productCategories => {
                        if (productCategories.length === 0) {
                            return next();
                        }
                        res.locals.productCategories = productCategories;
                        var categoriesDone = 0;
                        var resultFields = [];
                        productCategories.forEach(productCategory => {
                            Field.find({
                                    _id: {
                                        $in: productCategory.fields
                                    }
                                })
                                .then(fields => {
                                    if (fields.length > 0) {
                                        fields.forEach(field => {
                                            const item = product.data.find(d => d.fieldId.toString() === field.id);
                                            resultFields.push({
                                                _id: field.id,
                                                fieldValue: item ? item.fieldValue : "",
                                                name: field.name
                                            })
                                        });
                                    }
                                    categoriesDone++;
                                    if (categoriesDone === productCategories.length) {
                                        res.locals.fields = resultFields;
                                        next();
                                    }
                                })
                                .catch(err => next(err));
                        });
                    })
                    .catch(err => next(err));
            } else {
                req.flash('errors', 'Не удалось найти продукт.');
                res.redirect('/admin/products/');
            }
        })
        .catch(err => next(err));
}, (req, res, next) => {
    res.render('admin/product-data', {
        csrfToken: req.csrfToken()
    });
});

// Add category to product
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
    // fields from form
    var fields = req.body;
    const fieldsLength = Object.keys(fields).length;
    var done = 0;
    Product.findById(productId)
        .then(product => {
            req.product = product;
            for (f in fields) {
                (function (field) {
                    if (field !== '_csrf') {
                        var f = field;
                        // find index of object {fieldId, fieldValue} in data
                        const index = product.data.findIndex(d => d.fieldId.toString() === f);
                        if (fields[f].length === 0) {
                            product.data.splice(index, 1);
                        } else {
                            // field does not exist in array
                            if (index === -1) {
                                product.data.push({
                                    fieldId: f,
                                    fieldValue: fields[f]
                                });
                            } else {
                                product.data[index] = {
                                    fieldId: f,
                                    fieldValue: fields[f]
                                }
                            }
                        }
                    }
                    done++;
                    if (done === fieldsLength) {
                        next();
                    }
                })(f);
            }
        })
        .catch(err => next(err));
}, (req, res, next) => {
    const productId = req.params.id;
    Product.findByIdAndUpdate(productId, req.product)
        .then(updateResult => {
            res.redirect('/admin/product/' + productId + '/data');
        })
        .catch(err => next(err));
});

module.exports = router;