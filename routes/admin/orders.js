var express = require('express');
var router = express.Router();
var moment = require('moment');
moment.locale('ru');
var mongoose = require('mongoose');

var Order = require('../../models/order');

var csrf = require('csurf');
router.use(csrf());

/* GET Admin Orders page. */
router.get('/', function (req, res, next) {
    res.locals.title = 'Панель управления / Заказы - ' + res.locals.shopTitle;
    Order.find().sort({_id: -1}).populate('user')
        .then(orders => {
            orders = orders.map(o => {
                o.date = moment(mongoose.Types.ObjectId(o._id).getTimestamp()).fromNow();
                return o;
            });
            res.render('admin/orders', {
                orders: orders,
                ordersMenu: true
            });
        });
});

module.exports = router;