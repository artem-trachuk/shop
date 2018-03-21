var express = require('express');
var router = express.Router();

var csrf = require('csurf');
router.use(csrf());

var Category = require('../../models/category');
var Field = require('../../models/field');

/* GET Admin Category editor */
router.get('/', function (req, res, next) {
    res.locals.title = 'Панель управления / Категории / Создать категорию - ' + res.locals.shopTitle;
    Category.find()
        .then(categories => {
            res.render('admin/category', {
                categories: categories,
                csrfToken: req.csrfToken()
            });
        })
        .catch(err => {
            res.flash('errors', 'В данный момент запрос не может быть выполнен.');
            res.redirect('/admin/category');
        });
});

/* POST Admin Category editor */
router.post('/', function (req, res, next) {
    var category = req.body;
    Category.findOne({
            name: category.name
        })
        .then(oneCategory => {
            // Category not found
            if (!oneCategory) {
                Category.create(new Category({
                        name: category.name,
                        parentCategory: category.parentCategory
                    }))
                    .then(createResult => {
                        req.flash('success', 'Категория создана.');
                        res.redirect('/admin/category/' + createResult._id);
                    });
            } else { // Category exist
                req.flash('errors', 'Такая категория уже существует.');
                res.redirect('/admin/category');
            }
        })
        .catch(err => {
            req.flash('errors', 'В данный момент запрос не может быть выполнен.');
            res.redirect('/admin/category');
        });
});

/* GET Admin Category editor by id */
router.get('/:id', function (req, res, next) {
    var categoryId = req.params.id;
    Category.findById(categoryId)
        .then(c => {
            Category.find({
                    _id: {
                        $ne: c._id
                    }
                })
                .then(categories => {
                    var selectedValue;
                    if (c.parentCategory) {
                        selectedValue = c.parentCategory.toString();
                    }
                    res.render('admin/category', {
                        category: c,
                        categories: categories,
                        selectedValue: selectedValue,
                        csrfToken: req.csrfToken()
                    });
                });
        })
        .catch(err => {
            req.flash('errors', 'В данный момент запрос не может быть выполнен.');
            res.redirect('/admin');
        });
});

/* POST Admin Category editor by id */
router.post('/:id', function (req, res, next) {
    category = req.body;
    categoryId = req.params.id;
    Category.findByIdAndUpdate(categoryId, {
            name: category.name,
            parentCategory: category.parentCategory
        })
        .then(updateResult => {
            req.flash('success', 'Информация о категории обновлена.');
            res.redirect('/admin/category/' + updateResult._id);
        })
        .catch(err => {
            req.flash('errors', 'В данный момент запрос не может быть выполнен.');
            res.redirect('/admin/category/' + updateResult._id);
        });
});

/* GET Admin Category Fields. */
router.get('/:id/fields/', (req, res, next) => {
    Field.find()
        .then(fields => {
            res.locals.allFields = fields;
            next();
        })
        .catch(err => next(err));
}, (req, res, next) => {
    var categoryId = req.params.id;
    // Find category
    Category.findById(categoryId)
        .then(category => {
            res.locals.title = 'Панель управления / Категории / ' + category.name + ' / Поля категории - ' + res.locals.shopTitle;
            res.locals.category = category;
            if (category.fields.length > 0) {
                res.locals.fields = res.locals.allFields.filter(
                    allF => category.fields.find(catF => {
                        return catF.toString() === allF.id;
                    }) !== undefined
                );
                res.locals.allFields = res.locals.allFields.filter(
                    allF => category.fields.find(catF => {
                        return catF.toString() === allF.id;
                    }) === undefined
                );
            };
            next();
        })
        .catch(err => next(err));
}, (req, res, next) => {
    res.render('admin/category-fields', {
        csrfToken: req.csrfToken()
    });
});

/* POST Admin Category Field. */
router.post('/:id/field', function (req, res, next) {
    var fieldName = req.body.name;
    var categoryId = req.params.id;
    Field.findOne({
            name: fieldName
        })
        .then(findResult => {
            // Field not found
            if (!findResult) {
                // Create field
                Field.create({
                        name: fieldName
                    })
                    .then(createResult => {
                        saveFieldInCategory(createResult._id);
                    });
            } else {
                // Field found
                saveFieldInCategory(findResult._id);
            }
        })
        .catch(err => console.log(err));
    var saveFieldInCategory = function (fieldId) {
        // Find category by id
        Category.findById(categoryId)
            .then(c => {
                // Add field to category
                if (c.fields.find(f => f.toString() === fieldId.toString()) === undefined) {
                    c.fields.push(fieldId);
                    c.save()
                        .then(save => {
                            return next();
                        });
                }
                next();
            });
    }
}, (req, res, next) => {
    res.redirect('/admin/category/' + req.params.id + '/fields');
});

router.get('/:categoryId/add-field/:fieldId', (req, res, next) => {
    Category.findByIdAndUpdate(req.params.categoryId, {
        $push: {
            fields: req.params.fieldId
        }
    }).then(updRes => {
        res.redirect('/admin/category/' + req.params.categoryId + '/fields');
    });
});

router.get('/:categoryId/delete-field/:fieldId', (req, res, next) => {
    Category.findByIdAndUpdate(req.params.categoryId, {
        $pull: {
            fields: req.params.fieldId
        }
    }).then(updRes => {
        res.redirect('/admin/category/' + req.params.categoryId + '/fields');
    });
});

module.exports = router;