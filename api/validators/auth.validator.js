const { body } = require('express-validator');

const registerValidator = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email address')
]

const loginValidator = [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
]

const forgotPasswordValidator = [
    body('email').trim().isEmail().withMessage('A valid email is required')
]

const resetPasswordValidator = [
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
]

module.exports = {
    registerValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator
}
