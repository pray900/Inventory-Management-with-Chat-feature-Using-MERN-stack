const router = require('express').Router();
const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcryptjs');

const UserModel = require('./../models/user.model')
const MAP_USER_REQ = require('./../helpers/map_user_req');
const Uploader = require('./../middlewares/uploader')('image');
const restrictTo = require('./../middlewares/authorization');
const { isSelfOrAdmin } = require('./../middlewares/ownership');
const ROLES = require('./../constants/roles');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const { updateValidator } = require('./../validators/user.validator');
const validate = require('./../validators/validate');

router.route('/')
    .get(restrictTo(ROLES.ADMIN), catchAsync(async function (req, res) {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            UserModel.find({}).sort({ _id: -1 }).skip(skip).limit(limit),
            UserModel.countDocuments({})
        ]);

        res.json({
            data,
            total,
            page,
            pages: Math.max(Math.ceil(total / limit), 1)
        });
    }));

router.route('/:id')
    .get(isSelfOrAdmin, catchAsync(async function (req, res, next) {
        const user = await UserModel.findById(req.params.id);
        if (!user) {
            return next(new AppError(404, 'User Not Found'));
        }
        res.json(user)
    }))
    .put(isSelfOrAdmin, Uploader.single('image'), updateValidator, validate, catchAsync(async function (req, res, next) {
        if (req.fileTypeError) {
            return next(new AppError(406, 'Invalid File Format'));
        }

        const user = await UserModel.findById(req.params.id);
        if (!user) {
            return next(new AppError(404, 'User not found'));
        }

        const oldImage = user.image;
        const request_data = req.body;
        if (req.file) {
            request_data.image = req.file.filename;
        }
        if (request_data.password) {
            request_data.password = await bcrypt.hash(request_data.password, 10);
        }

        // role / isArchived / status are privileged fields — only an admin
        // may change them (status in particular gates login, see auth.controller.js)
        if (req.user.role === ROLES.ADMIN) {
            if (request_data.role !== undefined) user.role = request_data.role;
            if (request_data.isArchived !== undefined) user.isArchived = request_data.isArchived;
            if (request_data.status !== undefined) user.status = request_data.status;
        }

        const mappedUpdatedUser = MAP_USER_REQ(request_data, user)
        const updated = await mappedUpdatedUser.save();
        res.json(updated)

        if (req.file && oldImage) {
            fs.unlink(path.join(process.cwd(), 'uploads/images', oldImage)).catch(() => {});
        }
    }))
    .delete(restrictTo(ROLES.ADMIN), catchAsync(async function (req, res, next) {
        const removed = await UserModel.findByIdAndDelete(req.params.id);
        if (!removed) {
            return next(new AppError(404, 'User not found'));
        }
        res.json(removed);
    }));

module.exports = router;
