const jwt = require('jsonwebtoken');
const configs = require('./../configs');
const UserModel = require('./../models/user.model');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');

module.exports = catchAsync(async function (req, res, next) {
    let token;
    if (req.headers['authorization']) token = req.headers['authorization']
    if (req.headers['x-access-token']) token = req.headers['x-access-token']
    if (req.query['token']) token = req.query['token']

    if (!token) {
        return next(new AppError(401, 'Authentication Failed, Token Not Provided'));
    }

    token = token.split(' ')[1] || token;

    let decoded;
    try {
        decoded = jwt.verify(token, configs.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
        return next(err);
    }

    const user = await UserModel.findById(decoded._id);
    if (!user) {
        return next(new AppError(404, 'User removed from system'));
    }

    req.user = user;
    next();
})
