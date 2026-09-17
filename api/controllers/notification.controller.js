const router = require('express').Router();

const NotificationModel = require('./../models/notification.model');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');

router.get('/', catchAsync(async function (req, res) {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;
    const condition = { user: req.user._id };

    const [data, total, unreadCount] = await Promise.all([
        NotificationModel.find(condition).sort({ _id: -1 }).skip(skip).limit(limit).populate('product', { name: 1 }),
        NotificationModel.countDocuments(condition),
        NotificationModel.countDocuments({ user: req.user._id, read: false })
    ]);

    res.json({
        data,
        total,
        page,
        pages: Math.max(Math.ceil(total / limit), 1),
        unreadCount
    });
}))

router.put('/read-all', catchAsync(async function (req, res) {
    await NotificationModel.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ msg: 'All notifications marked as read' });
}))

router.put('/:id/read', catchAsync(async function (req, res, next) {
    const notification = await NotificationModel.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { read: true },
        { new: true }
    );
    if (!notification) {
        return next(new AppError(404, 'Notification not found'));
    }
    res.json(notification);
}))

module.exports = router;
