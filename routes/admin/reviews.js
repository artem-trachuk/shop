var express = require('express');
var router = express.Router();
var moment = require('moment');
moment.locale('ru');
var mongoose = require('mongoose');

var Review = require('../../models/review');

var csrf = require('csurf');
router.use(csrf());

router.get('/', (req, res, next) => {
  Review.find().populate('user').sort({
      _id: -1
    })
    .then(reviews => {
      reviews = reviews.map(r => {
        r.date = moment(mongoose.Types.ObjectId(r._id).getTimestamp()).startOf('day').fromNow();
        return r;
      });
      res.locals.title = 'Панель управления / Отзывы - ' + res.locals.shopTitle;
      res.locals.reviews = reviews;
      res.locals.reviewsMenu = true;
      next();
    })
    .catch(err => next(err));
}, (req, res, next) => {
  res.render('admin/reviews');
});

module.exports = router;