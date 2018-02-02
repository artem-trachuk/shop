var Category = require('../../models/category');
var Config = require('../../models/config');

module.exports = function buildCategories(req, res, next) {
    var done = 0;
    var findCategoriesRecursive = function (categories, categoriesCount, cb) {
        categories.forEach(category => {
            Category.find({
                    parentCategoryId: category.id
                })
                .then(categoriesByParent => {
                    if (categoriesByParent.length !== 0) {
                        category.categories = categoriesByParent;
                        done += categoriesByParent.length;
                        if (done === categoriesCount) {
                            cb(true);
                        } else {
                            findCategoriesRecursive(categoriesByParent, categoriesCount, cb);
                        }
                    }
                })
                .catch(err => {
                    //
                });
        });
    };
    Category.count()
        .then(count => {
            if (count === 0) {
                return next();
            }
            Category.find({
                    parentCategoryId: {
                        $exists: false
                    }
                })
                .then(categories => {
                    if (categories.length === 0) {
                        return next();
                    }
                    if (categories.length === count) {
                        res.locals.categories = categories;
                        return next();
                    }
                    findCategoriesRecursive(categories, count - categories.length, (result) => {
                        res.locals.categories = categories;
                        next();
                    });
                })
                .catch(err => {
                    next();
                });
        })
        .catch(err => {
            next();
        });
}