const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    point: {
        type: Number,
        min: 1,
        max: 5
    },
    message: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

const ProductSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    quantity: Number,
    modelNo: String,
    // attribute: {
    //     type: String 
    // },
    category: {
        type: String,
        required: true
    },
    color: String,
    brand: String,
    price: Number,
    costPrice: Number,
    size: String,
    // seller information
    vendor: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    images: [String],
    sku: Number,
    status: {
        type: String,
        enum: ['available', 'out-of-stock', 'booked'],
        default: 'available'
    },
    reviews: [reviewSchema],
    manuDate: Date,
    expiryDate: Date,
    purchasedDate: Date,
    salesDate: Date,
    discount: {
        discountedItem: Boolean,
        discountType: {
            type: String,
            enum: ['percentage', 'quantity', 'value']
        },
        discountValue: String
    },
    isReturnEligible: Boolean,
    warrentyStatus: Boolean,
    warrentyPeriod: String,
    origin: String,
    tags: [String],
    offers: [String],
    orderNumber: Number
}, {
    timestamps: true
})

module.exports = mongoose.model('product', ProductSchema)
