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
                });
        });
    }
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
                    findCategoriesRecursive(categories, count - categories.length, (result) => {
                        res.locals.categories = categories;
                        next();
                    });
                });
        });
}