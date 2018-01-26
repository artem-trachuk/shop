var express = require('express');
var router = express.Router();

var csrf = require('csurf');
router.use(csrf());

var Category = require('../../models/category');
var Field = require('../../models/field');

/* GET Admin Category editor */
router.get('/', function (req, res, next) {
    var errors = req.flash('errors');
    Category.find()
        .then(categories => {
            res.render('admin/category', {
                categories: categories,
                errors: errors,
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
                        parentCategoryId: category.parentCategory
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
    var errors = req.flash('errors');
    var success = req.flash('success');
    Category.findById(categoryId)
        .then(c => {
            Category.find({
                name: {
                    $ne: c.name
                }
            })
            .then(categories => {
                var selectedValue;
                if (c.parentCategoryId) {
                    selectedValue = c.parentCategoryId.toString();
                }
                res.render('admin/category', {
                    category: c,
                    categories: categories,
                    success: success,
                    selectedValue: selectedValue,
                    errors: errors,
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
        parentCategoryId: category.parentCategory
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
router.get('/:id/fields/', function (req, res, next) {
    var categoryId = req.params.id;
    // Find category
    Category.findById(categoryId)
        .then(c => {
            if (c.fields.length > 0) {
                var fields = [];
                var done = 0;
                // Find field names
                c.fields.forEach(field => {
                    Field.findOne({
                            _id: field
                        })
                        .then(f => {
                            fields.push(f.name);
                            done++;
                            if (done === c.fields.length) {
                                res.render('admin/category-fields', {
                                    category: c,
                                    fields: fields,
                                    csrfToken: req.csrfToken()
                                });
                            }
                        });
                });
            } else {
                res.render('admin/category-fields', {
                    category: c,
                    csrfToken: req.csrfToken()
                });
            }
        })
        .catch(err => console.log(err));
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
            }
            // Field found
            saveFieldInCategory(findResult._id);
        })
        .catch(err => console.log(err));
    var saveFieldInCategory = function (fieldId) {
        // Find category by id
        Category.findById(categoryId)
            .then(c => {
                // Add field to category
                c.fields.push(fieldId);
                c.save()
                    .then(save => {
                        return res.redirect('/admin/category/' + categoryId + '/fields');
                    });
            });
    }
});

module.exports = router;