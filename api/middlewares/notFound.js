const AppError = require('./../utils/AppError');

module.exports = function (req, res, next) {
    next(new AppError(404, 'Not Found'));
}
