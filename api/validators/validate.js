const { validationResult } = require('express-validator');
const AppError = require('./../utils/AppError');

module.exports = function (req, res, next) {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const message = errors.array().map(e => e.msg).join(', ');
    next(new AppError(400, message));
}
