const AppError = require('./../utils/AppError');

// usage: restrictTo(ROLES.ADMIN) as route middleware, after `authenticate`
module.exports = function restrictTo(...allowedRoles) {
    return function (req, res, next) {
        if (allowedRoles.includes(req.user.role)) {
            return next();
        }
        next(new AppError(403, "Authorization Failed! You Dont have access"));
    }
}
