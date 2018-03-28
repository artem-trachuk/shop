var express = require('express');
var router = express.Router();
var multer = require('multer');
var conf = require('../../shop-config');
var storage = multer.memoryStorage();
var upload = multer({
    storage: storage
});
var fs = require('fs');
var xlsx = require('node-xlsx').default;
var lsXlsx = require('ls-xlsx');

var csrf = require('csurf');
router.use(csrf());

var Category = require('./../../models/category');
var Product = require('./../../models/product');
var Counter = require('../../models/counter');
var Field = require('./../../models/field');

router.get('/', (req, res, next) => {
    Field.findOne({
            name: 'Производитель'
        })
        .then(field => {
            if (!field) {
                Field.create({
                        name: 'Производитель'
                    })
                    .then(createResult => {
                        next();
                    })
                    .catch(err => next(err));
            } else {
                next();
            }
        })
        .catch(err => next(err));
}, (req, res, next) => {
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
    if (req.file.originalname !== 'Price_Infotech_foto.xlsm') {
        req.flash('errors', 'Неправильный файл! Загрузите файл с названием Price_Infotech_Partner.xlsx.');
        return res.redirect('/admin/parser');
    }
    const parsedBuffer = xlsx.parse(req.file.buffer)[0].data;
    if (parsedBuffer[7][0] !== '№' ||
        parsedBuffer[7][1] !== 'Код' ||
        parsedBuffer[7][2] !== 'Производитель' ||
        parsedBuffer[7][3] !== 'Изображение' ||
        parsedBuffer[7][4] !== 'Номенклатура' ||
        parsedBuffer[7][5] !== 'Наименование' ||
        parsedBuffer[7][6] !== 'Наличие' ||
        parsedBuffer[7][7] !== 'Наличие NBD' ||
        parsedBuffer[7][8] !== 'Гарантия' ||
        parsedBuffer[7][9] !== '0.Розн.Грн.(РРЦ)' ||
        parsedBuffer[7][10] !== '1.Розн.$ (РРЦ)') {
            req.flash('errors', 'Обнаружены изменения в структуре файла, парсинг невозможен.');
            return res.redirect('/admin/parser');
        }
    const lsParsedBuffer = lsXlsx.read(req.file.buffer);
    const firstSheetName = lsParsedBuffer.SheetNames[0];
    const parsedImages = lsParsedBuffer.Sheets[firstSheetName]['!images'];
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
                            Field.findOne({
                                    name: 'Производитель'
                                })
                                .then(field => {
                                    if (field) {
                                        Category.create({
                                                name: categoryName,
                                                fields: [field._id]
                                            }).then(createResult => {
                                                categories.push({
                                                    index: index,
                                                    category: createResult
                                                });
                                                addedCategories++;
                                                checkDone();
                                            })
                                            .catch(err => next(err));
                                    }
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
                if (parsedBuffer[index].length >= 10) {
                    if (parsedBuffer[index][0] === 'Группа' || parsedBuffer[index][0] === '№' || parsedBuffer[index][0] === undefined) {
                        checkProductsDone();
                    } else {
                        var product = parsedBuffer[index];
                        Product.findOne({
                                title: product[4]
                            })
                            .then(one => {
                                if (!one) {
                                    if (product[6] === 'Нет' && product[7] === 'Нет') {
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
                                        var cell = 'C' + (index);
                                        var image = parsedImages.find(v => v.fromCell === cell);
                                        if (image) {
                                            var buffer = image.data().asNodeBuffer();
                                            var imageName = '/uploads/' + image.name;
                                            fs.writeFile(`${conf.dest}/${image.name}`, buffer)
                                            .then(writeResult => {

                                            })
                                            .catch(err => next(err));
                                        }
                                        Field.findOne({
                                                name: 'Производитель'
                                            })
                                            .then(field => {
                                                if (field) {
                                                    Product.create({
                                                            article: counter.product,
                                                            title: product[4],
                                                            description: product[5],
                                                            price: product[9],
                                                            USDprice: product[10],
                                                            categories: [category],
                                                            imagePath: imageName ? imageName : undefined,
                                                            data: [{
                                                                field: field._id,
                                                                fieldValue: product[2]
                                                            }]
                                                        }).then(createResult => {
                                                            addedProducts++;
                                                            checkProductsDone();
                                                        })
                                                        .catch(err => next(err));
                                                }
                                            })
                                            .catch(err => next(err));
                                    }).catch(err => next(err));
                                } else {
                                    if (product[6] === 'Нет' && product[7] === 'Нет') {
                                        Product.findByIdAndRemove(one._id)
                                            .then(removeResult => {
                                                removedProducts++;
                                                checkProductsDone();
                                            })
                                            .catch(err => next(err));
                                    } else {
                                        Product.findByIdAndUpdate(one.id, {
                                                title: product[4],
                                                description: product[5],
                                                price: product[9],
                                                USDprice: product[10]
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