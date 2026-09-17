const { body } = require('express-validator');

// midnight today — "expiry in the past" means strictly before today
const startOfToday = () => new Date(new Date().toDateString());

// Rules that apply to BOTH create and update. Every field is optional here
// (each runs only if the value is present), so a partial update is fine while
// a create still gets the same checks. `.withMessage()` is what the user sees.
const sharedRules = [
    body('price').optional({ checkFalsy: true }).isFloat({ min: 0 })
        .withMessage('Price must be a number and cannot be negative'),

    body('costPrice').optional({ checkFalsy: true }).isFloat({ min: 0 })
        .withMessage('Cost price must be a number and cannot be negative'),

    body('quantity').optional({ checkFalsy: true }).isInt({ min: 0 })
        .withMessage('Quantity must be a whole number and cannot be negative'),

    body('manuDate').optional({ checkFalsy: true }).isISO8601()
        .withMessage('Manufacture date is not a valid date')
        .custom((value) => {
            if (new Date(value) > new Date()) {
                throw new Error('Manufacture date cannot be in the future');
            }
            return true;
        }),

    body('expiryDate').optional({ checkFalsy: true }).isISO8601()
        .withMessage('Expiry date is not a valid date')
        .custom((value) => {
            if (new Date(value) < startOfToday()) {
                throw new Error('Expiry date cannot be in the past');
            }
            return true;
        })
        .custom((value, { req }) => {
            if (req.body.manuDate && new Date(value) <= new Date(req.body.manuDate)) {
                throw new Error('Expiry date must be after the manufacture date');
            }
            return true;
        })
];

const createValidator = [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    ...sharedRules
];

const updateValidator = [
    ...sharedRules
];

module.exports = {
    createValidator,
    updateValidator
}
