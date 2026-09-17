const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserModel = require('./../models/user.model');
const MAP_USER_REQ = require('./../helpers/map_user_req');
const Uploader = require('./../middlewares/uploader')('image');
const configs = require('../configs');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const { sendMail } = require('./../utils/mailer');
const { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator } = require('./../validators/auth.validator');
const validate = require('./../validators/validate');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function generateToken(user) {
    return jwt.sign({
        _id: user._id,
        username: user.username,
        role: user.role
    }, configs.JWT_SECRET, {
        expiresIn: configs.JWT_EXPIRES_IN,
        algorithm: 'HS256'
    })
}

function stripPassword(userDoc) {
    const user = userDoc.toObject();
    delete user.password;
    return user;
}

router.post('/login', loginValidator, validate, catchAsync(async function (req, res, next) {
    const user = await UserModel.findOne({ username: req.body.username }).select('+password');
    if (!user) {
        return next(new AppError(400, 'This username is not registered'));
    }

    const isMatched = await bcrypt.compare(req.body.password, user.password);
    if (!isMatched) {
        return next(new AppError(400, 'Incorrect password'));
    }

    if (user.status === 'inactive') {
        return next(new AppError(400, 'Your account is disabled please contact system administrator for support'));
    }

    const token = generateToken(user);
    res.json({
        user: stripPassword(user),
        token
    })
}))

router.post('/register', Uploader.single('image'), registerValidator, validate, catchAsync(async function (req, res, next) {
    const request_data = req.body;
    if (req.fileTypeError) {
        return next(new AppError(406, 'Invalid file format'));
    }
    if (req.file) {
        request_data.image = req.file.filename;
    }

    const newUser = new UserModel({});
    const newMappedUser = MAP_USER_REQ(request_data, newUser)
    newMappedUser.password = await bcrypt.hash(req.body.password, 10);

    const saved = await newMappedUser.save();
    res.status(201).json(stripPassword(saved));
}))

router.post('/forgot-password', forgotPasswordValidator, validate, catchAsync(async function (req, res) {
    const user = await UserModel.findOne({ email: req.body.email });

    // Always respond the same way whether or not the email is registered —
    // don't let this endpoint be used to enumerate valid accounts.
    const genericResponse = { msg: 'If that email is registered, a password reset link has been sent.' };

    if (!user) {
        return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashToken(rawToken);
    user.passwordResetExpires = Date.now() + RESET_TOKEN_TTL_MS;
    await user.save();

    const resetUrl = `${configs.FRONTEND_URL}/reset_password/${rawToken}`;
    await sendMail({
        to: user.email,
        subject: 'Reset your password',
        html: `<p>You requested a password reset. This link expires in 1 hour:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can ignore this email.</p>`
    });

    res.json(genericResponse);
}))

router.post('/reset-password/:token', resetPasswordValidator, validate, catchAsync(async function (req, res, next) {
    const hashedToken = hashToken(req.params.token);
    const user = await UserModel.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
        return next(new AppError(400, 'Invalid or expired reset link, please request a new one.'));
    }

    user.password = await bcrypt.hash(req.body.password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ msg: 'Password reset successfully, please log in.' });
}))

module.exports = router;
