const AppError = require('./../utils/AppError');
const ROLES = require('./../constants/roles');
const ProductModel = require('./../components/products/product.model');
const catchAsync = require('./../utils/catchAsync');

const isSelfOrAdmin = catchAsync(async function (req, res, next) {
    if (req.user.role === ROLES.ADMIN || String(req.user._id) === req.params.id) {
        return next();
    }
    next(new AppError(403, 'You can only access your own account'));
})

const isVendorOrAdmin = catchAsync(async function (req, res, next) {
    const product = await ProductModel.findById(req.params.id);
    if (!product) {
        return next(new AppError(404, 'Product Not Found'));
    }
    if (req.user.role === ROLES.ADMIN || (product.vendor && String(product.vendor) === String(req.user._id))) {
        req.product = product;
        return next();
    }
    next(new AppError(403, 'You can only modify your own products'));
})

module.exports = {
    isSelfOrAdmin,
    isVendorOrAdmin
}
