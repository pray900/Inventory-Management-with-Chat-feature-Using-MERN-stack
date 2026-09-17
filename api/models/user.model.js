const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    phoneNumber: {
        type: Number
    },
    address: {
        permanentAddress: String,
        temporaryAddress: [String]
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'others']
    },
    dob: {
        type: Date
    },
    country: {
        type: String,
        default: 'nepal'
    },
    image: {
        type: String
    },
    role: {
        type: Number, // 1 = admin, 2 = general user, 3 = visitor (see constants/roles.js)
        default: 2
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: 'active'
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    }
}, {
    timestamps: true
})

const UserModel = mongoose.model('user', UserSchema)
module.exports = UserModel;
