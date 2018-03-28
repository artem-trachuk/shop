module.exports = function (locals, page, count, perPage) {
    locals.prevPageIndex = page - 1;
    locals.prevPageDisabled = page > 1 ? false : true;
    locals.nextPageIndex = page + 1;
    locals.nextPageDisabled = ((page) < (count / perPage)) ? false : true;
}