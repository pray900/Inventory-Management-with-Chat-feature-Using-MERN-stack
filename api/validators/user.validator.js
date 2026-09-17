const { body } = require('express-validator');

const updateValidator = [
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email address'),
    body('phoneNumber').optional({ checkFalsy: true }).isNumeric().withMessage('Phone number must be numeric')
]

module.exports = {
    updateValidator
}
