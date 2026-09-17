const router = require('express').Router();
const productCtrl = require('./product.controller')
const Uploader = require('./../../middlewares/uploader')('image')
const authenticate = require('./../../middlewares/authentication')
const { isVendorOrAdmin } = require('./../../middlewares/ownership')
const { createValidator, updateValidator } = require('./../../validators/product.validator')
const validate = require('./../../validators/validate')

router.route('/')
    .get(authenticate, productCtrl.get)
    .post(authenticate, Uploader.array('images'), createValidator, validate, productCtrl.post);

router.route('/add_review/:productId')
    .post(authenticate, productCtrl.addReview)

router.route('/search')
    .get(productCtrl.search)
    .post(productCtrl.search)

router.route('/:id')
    .get(authenticate, productCtrl.getById)
    .put(authenticate, isVendorOrAdmin, Uploader.array('images'), updateValidator, validate, productCtrl.update)
    .delete(authenticate, isVendorOrAdmin, productCtrl.remove);

module.exports = router;
