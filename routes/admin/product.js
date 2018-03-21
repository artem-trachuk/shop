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
                title: 'Панель управления' + ' / Продукты / ' + doc.title + ' - ' + res.locals.shopTitle,
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
                if (doc.imagePath) {
                    imagePath = doc.imagePath.replace('/uploads/', '');
                    require('fs').unlink(conf.dest + imagePath);
                }
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
                res.locals.title = 'Панель управления / Продукты / ' + product.title + ' / Данные - ' + res.locals.shopTitle;
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
                                            if (resultFields.length === 0 || resultFields.find(f => f._id === field.id) === undefined) {
                                                const item = product.data.find(d => d.field.toString() === field.id);
                                                resultFields.push({
                                                    _id: field.id,
                                                    fieldValue: item ? item.fieldValue : "",
                                                    name: field.name
                                                });
                                            }
                                        });
                                    }
                                    categoriesDone++;
                                    if (categoriesDone === productCategories.length) {
                                        res.locals.fields = resultFields.sort(function(a, b) {
                                            var nameA = a.name.toUpperCase(); // ignore upper and lowercase
                                            var nameB = b.name.toUpperCase(); // ignore upper and lowercase
                                            if (nameA < nameB) {
                                              return -1;
                                            }
                                            if (nameA > nameB) {
                                              return 1;
                                            }
                                          
                                            // names must be equal
                                            return 0;
                                          });
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
                                if (product.categories.find(c => c.toString() === category.id) === undefined) {
                                    product.categories.push(category.id);
                                    if (category.parentCategory) {
                                        addCategory(category.parentCategory);
                                    } else {
                                        product.save()
                                            .then(save => next());
                                    }
                                } else {
                                    product.save()
                                        .then(save => next());
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
}, (req, res, next) => {
    res.redirect('/admin/product/' + req.params.id + '/data')
});

router.get('/:id/delete-category/:categoryId', (req, res, next) => {
    Category.findById(req.params.categoryId)
        .then(category => {
            res.fields = category.fields;
            next();
        })
        .catch(err => next(err));
}, (req, res, next) => {
    Product.findByIdAndUpdate(req.params.id, {
            $pull: {
                categories: req.params.categoryId,
                data: {
                    field: {
                        $in: res.fields
                    }
                }
            }
        })
        .then(updateResult => {
            res.redirect('/admin/product/' + req.params.id + '/data');
        })
        .catch(err => next(err));
})

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
                        // find index of object {field, fieldValue} in data
                        const index = product.data.findIndex(d => d.field.toString() === f);
                        if (fields[f].length === 0) {
                            product.data.splice(index, 1);
                        } else {
                            // field does not exist in array
                            if (index === -1) {
                                product.data.push({
                                    field: f,
                                    fieldValue: fields[f]
                                });
                            } else {
                                product.data[index] = {
                                    field: f,
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