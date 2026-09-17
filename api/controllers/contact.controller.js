const router = require('express').Router();
const { body } = require('express-validator');

const configs = require('./../configs');
const { sendMail } = require('./../utils/mailer');
const catchAsync = require('./../utils/catchAsync');
const validate = require('./../validators/validate');

const contactValidator = [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required')
]

router.post('/', contactValidator, validate, catchAsync(async function (req, res) {
    await sendMail({
        to: configs.CONTACT_EMAIL || configs.SMTP_FROM,
        subject: `[Contact] ${req.body.subject}`,
        html: `<p>From: ${req.user.username} (${req.user.email || 'no email'})</p><p>${req.body.message}</p>`
    });

    res.json({ msg: 'Message sent' });
}))

module.exports = router;
