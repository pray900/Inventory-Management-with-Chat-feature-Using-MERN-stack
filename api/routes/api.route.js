const userRoute = require('./../controllers/users.controller');
const authRoute = require('./../controllers/auth.controller');
const productRoute = require('./../components/products/product.route');
const notificationRoute = require('./../controllers/notification.controller');
const contactRoute = require('./../controllers/contact.controller');

const authenticate = require('./../middlewares/authentication');

const router = require('express').Router();

router.use('/auth', authRoute);
router.use('/user', authenticate, userRoute);
router.use('/product', productRoute);
router.use('/notification', authenticate, notificationRoute);
router.use('/contact', authenticate, contactRoute);

module.exports = router;
