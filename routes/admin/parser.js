var express = require('express');
var router = express.Router();
var multer = require('multer');
var conf = require('../../shop-config');
var storage = multer.memoryStorage();
var upload = multer({
    storage: storage
});
var xlsx = require('node-xlsx').default;

var csrf = require('csurf');
router.use(csrf());

var Category = require('./../../models/category');
var Product = require('./../../models/product');
var Counter = require('../../models/counter');

router.get('/', (req, res, next) => {
    res.locals.title = 'Панель управления / Парсер - ' + res.locals.shopTitle;
    res.locals.parserMenu = true;
    res.locals.csrfToken = req.csrfToken();
    res.render('admin/parser');
});

router.post('/', upload.single('xlsx'), (req, res, next) => {
    if (!req.file) {
        req.flash('errors', 'Выберите файл!');
        return res.redirect('/admin/parser');
    }
    if (req.file.originalname !== 'Price_Infotech_Partner.xlsx') {
        req.flash('errors', 'Неправильный файл! Загрузите файл с названием Price_Infotech_Partner.xlsx.');
        return res.redirect('/admin/parser');
    }
    const parsedBuffer = xlsx.parse(req.file.buffer)[0].data;
    var done = 0;
    var categories = [];
    var addedCategories = 0;
    var checkDone = function () {
        done++;
        if (done === parsedBuffer.length) {
            parseProducts();
        }
    }
    for (var i = 0; i < parsedBuffer.length; i++) {
        (function (index) {
            // category
            if (parsedBuffer[index].length === 1) {
                var categoryName = parsedBuffer[index][0].substr(parsedBuffer[index][0].indexOf(' ') + 1);
                if (categoryName === '0.Новинки') {
                    categoryName = 'Новинки';
                }
                Category.findOne({
                        name: categoryName
                    })
                    .then(one => {
                        if (!one) {
                            Category.create({
                                    name: categoryName
                                }).then(createResult => {
                                    categories.push({
                                        index: index,
                                        category: createResult
                                    });
                                    addedCategories++;
                                    checkDone();
                                })
                                .catch(err => next(err));
                        } else {
                            categories.push({
                                index: index,
                                category: one
                            });
                            checkDone();
                        }
                    })
                    .catch(err => next(err));
            } else {
                checkDone();
            }
        })(i);
    }
    var productsDone = 0;
    var addedProducts = 0;
    var removedProducts = 0;
    var updatedProducts = 0;
    var checkProductsDone = function () {
        productsDone++;
        if (productsDone === parsedBuffer.length) {
            req.flash('success', `Добавлено ${addedCategories} категорий. Добавлено ${addedProducts} продуктов; обновлено ${updatedProducts} продуктов; удалено ${removedProducts} продуктов.`);
            res.redirect('/admin/parser');
        }
    }
    var parseProducts = function () {
        for (var i = 0; i < parsedBuffer.length; i++) {
            (function (index) {
                // product
                if (parsedBuffer[index].length >= 9) {
                    if (parsedBuffer[index][0] === 'Группа' || parsedBuffer[index][0] === '№' || parsedBuffer[index][0] === undefined) {
                        checkProductsDone();
                    } else {
                        var product = parsedBuffer[index];
                        Product.findOne({
                                title: product[3]
                            })
                            .then(one => {
                                if (!one) {
                                    if (product[5] === 'Нет') {
                                        return checkProductsDone();
                                    }
                                    Counter.findOneAndUpdate({
                                        $inc: {
                                            product: 1
                                        }
                                    }).then(counter => {
                                        var sortedCategories = categories.sort((a, b) => a.index < b.index ? -1 : 1);
                                        var smallerCategories = sortedCategories.filter((v, i) => v.index < index ? true : false);
                                        var category = smallerCategories[smallerCategories.length - 1].category;
                                        Product.create({
                                                article: counter.product,
                                                title: product[3],
                                                description: product[4],
                                                price: product[8],
                                                USDprice: product[9],
                                                categories: [category]
                                            }).then(createResult => {
                                                addedProducts++;
                                                checkProductsDone();
                                            })
                                            .catch(err => next(err));
                                    }).catch(err => next(err));
                                } else {
                                    if (product[5] === 'Нет') {
                                        Product.findByIdAndRemove(one._id)
                                            .then(removeResult => {
                                                removedProducts++;
                                                checkProductsDone();
                                            })
                                            .catch(err => next(err));
                                    } else {
                                        Product.findByIdAndUpdate(one.id, {
                                            title: product[3],
                                            description: product[4],
                                            price: product[8],
                                            USDprice: product[9]
                                        }).then(updateResult => {
                                            updatedProducts++;
                                            checkProductsDone();
                                        })
                                        .catch(err => next(err));
                                    }
                                }
                            })
                            .catch(err => next(err));
                    }
                } else {
                    checkProductsDone();
                }
            })(i);
        }
    }
});

module.exports = router;