const ProductModel = require('./product.model');
const AppError = require('./../../utils/AppError');

// A field counts as "provided" when it's neither undefined nor an empty
// string — an unfilled optional form field (date/number/enum inputs all
// default to '') arrives as '', and assigning that to a typed/enum schema
// path throws a Mongoose CastError/ValidationError instead of being skipped.
function isProvided(value) {
    return value !== undefined && value !== '';
}

function map_product_req(productData, product) {
    if (isProvided(productData.name))
        product.name = productData.name;
    if (isProvided(productData.category))
        product.category = productData.category;
    if (isProvided(productData.description))
        product.description = productData.description;
    if (isProvided(productData.quantity))
        product.quantity = productData.quantity;
    if (isProvided(productData.modelNo))
        product.modelNo = productData.modelNo;
    if (isProvided(productData.color))
        product.color = productData.color;
    if (isProvided(productData.brand))
        product.brand = productData.brand;
    if (isProvided(productData.price))
        product.price = productData.price;
    if (isProvided(productData.costPrice))
        product.costPrice = productData.costPrice;
    if (isProvided(productData.size))
        product.size = productData.size;
    if (isProvided(productData.vendor))
        product.vendor = productData.vendor;
    if (productData.images !== undefined)
        product.images = productData.images;
    if (isProvided(productData.sku))
        product.sku = productData.sku;
    if (isProvided(productData.status))
        product.status = productData.status;
    if (isProvided(productData.manuDate))
        product.manuDate = productData.manuDate;
    if (isProvided(productData.expiryDate))
        product.expiryDate = productData.expiryDate;
    if (isProvided(productData.purchasedDate))
        product.purchasedDate = productData.purchasedDate;
    if (isProvided(productData.salesDate))
        product.salesDate = productData.salesDate;
    if (productData.isReturnEligible !== undefined)
        product.isReturnEligible = productData.isReturnEligible === true || productData.isReturnEligible === 'true';
    if (productData.warrentyStatus !== undefined)
        product.warrentyStatus = productData.warrentyStatus === true || productData.warrentyStatus === 'true';
    if (isProvided(productData.warrentyPeriod))
        product.warrentyPeriod = productData.warrentyPeriod;
    if (isProvided(productData.origin))
        product.origin = productData.origin;
    if (productData.tags !== undefined)
        product.tags = typeof (productData.tags) === 'string' ? productData.tags.split(',').filter(Boolean) : productData.tags;
    if (productData.offers !== undefined)
        product.offers = typeof (productData.offers) === 'string' ? productData.offers.split(',').filter(Boolean) : productData.offers;
    if (isProvided(productData.orderNumber))
        product.orderNumber = productData.orderNumber;
    if (!product.discount)
        product.discount = {};
    if (productData.discountedItem !== undefined)
        product.discount.discountedItem = productData.discountedItem === true || productData.discountedItem === 'true';
    if (isProvided(productData.discountType))
        product.discount.discountType = productData.discountType;
    if (isProvided(productData.discountValue))
        product.discount.discountValue = productData.discountValue;
}

function map_review_data(reviewData, review) {
    if (isProvided(reviewData.user))
        review.user = reviewData.user
    if (isProvided(reviewData.reviewPoint))
        review.point = reviewData.reviewPoint
    if (isProvided(reviewData.reviewMessage))
        review.message = reviewData.reviewMessage;
}

function find(condition) {
    return ProductModel
        .find(condition)
        .sort({
            _id: -1
        })
        .populate('vendor', {
            username: 1,
            email: 1
        })
        .populate('reviews.user', {
            email: 1
        })
}

async function findPaginated(condition, page, limit) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        find(condition).skip(skip).limit(limit),
        ProductModel.countDocuments(condition)
    ]);
    return {
        data,
        total,
        page,
        pages: Math.max(Math.ceil(total / limit), 1)
    };
}

async function insert(data) {
    const newProduct = new ProductModel({});
    map_product_req(data, newProduct)
    return newProduct.save()
}

async function update(id, data) {
    const product = await ProductModel.findById(id);
    if (!product) {
        throw new AppError(404, 'Product Not Found');
    }

    map_product_req(data, product)
    if (data.newImages) {
        product.images = product.images.concat(data.newImages)
    }

    return product.save();
}

function remove(id) {
    return ProductModel.findByIdAndDelete(id)
}

async function addReview(productId, reviewData) {
    const product = await ProductModel.findById(productId);
    if (!product) {
        throw new AppError(404, 'Product Not Found');
    }

    const newReview = {};
    map_review_data(reviewData, newReview)

    product.reviews.push(newReview);
    return product.save();
}

module.exports = {
    find,
    findPaginated,
    insert,
    update,
    remove,
    addReview
}
