const productQuery = require("./product.query");
const catchAsync = require("./../../utils/catchAsync");
const AppError = require("./../../utils/AppError");
const ROLES = require("./../../constants/roles");
const NotificationModel = require("./../../models/notification.model");

const get = catchAsync(async function (req, res) {
  const condition = {};
  if (req.user.role !== ROLES.ADMIN) {
    condition.vendor = req.user._id;
  }
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const result = await productQuery.findPaginated(condition, page, limit);
  res.json(result);
});

const post = catchAsync(async function (req, res) {
  const data = req.body;
  if (req.files && req.files.length) {
    data.images = req.files.map(function (item) {
      return item.filename;
    });
  }
  data.vendor = req.user._id;

  const response = await productQuery.insert(data);
  res.status(201).json(response);
});

const getById = catchAsync(async function (req, res, next) {
  const results = await productQuery.find({ _id: req.params.id });
  if (!results.length) {
    return next(new AppError(404, "Product Not Found"));
  }
  res.json(results[0]);
});

const update = catchAsync(async function (req, res) {
  const data = req.body;
  if (req.files && req.files.length) {
    data.newImages = req.files.map(function (item) {
      return item.filename;
    });
  }

  const response = await productQuery.update(req.params.id, data);
  res.json(response);
});

const remove = catchAsync(async function (req, res, next) {
  const response = await productQuery.remove(req.params.id);
  if (!response) {
    return next(new AppError(404, "Product Not Found"));
  }
  res.json(response);
});

// Builds a real Mongo filter from the search form fields sent by
// SearchProduct.component.js (category, name, minPrice/maxPrice, color,
// brand, tags, fromDate/toDate) and returns the full matching array —
// the frontend expects an array (`response.data.length`, `.forEach`).
const search = catchAsync(async function (req, res) {
  const params = { ...req.query, ...req.body };
  const condition = {};

  if (params.category) {
    condition.category = params.category;
  }
  if (params.name) {
    condition.name = new RegExp(params.name, "i");
  }
  if (params.color) {
    condition.color = new RegExp(`^${params.color}$`, "i");
  }
  if (params.brand) {
    condition.brand = new RegExp(`^${params.brand}$`, "i");
  }
  if (params.minPrice || params.maxPrice) {
    condition.price = {};
    if (params.minPrice) condition.price.$gte = Number(params.minPrice);
    if (params.maxPrice) condition.price.$lte = Number(params.maxPrice);
  }
  if (params.tags) {
    const tags =
      typeof params.tags === "string" ? params.tags.split(",") : params.tags;
    condition.tags = { $in: tags };
  }
  if (params.fromDate || params.toDate) {
    condition.createdAt = {};
    if (params.fromDate) condition.createdAt.$gte = new Date(params.fromDate);
    if (params.toDate) condition.createdAt.$lte = new Date(params.toDate);
  }

  const results = await productQuery.find(condition);
  res.json(results);
});

const addReview = catchAsync(async function (req, res) {
  const data = req.body;
  data.user = req.user._id;
  const response = await productQuery.addReview(req.params.productId, data);
  res.json(response);

  // Notify the vendor — a side effect of the review, not the point of the
  // request, so a failure here must never surface as a failed review.
  if (response.vendor && String(response.vendor) !== String(req.user._id)) {
    NotificationModel.create({
      user: response.vendor,
      type: "review",
      message: `${req.user.username} left a review on ${response.name}`,
      product: response._id,
    }).catch(function (err) {
      console.error("failed to create review notification >>", err);
    });
  }
});

module.exports = {
  get,
  post,
  getById,
  update,
  remove,
  search,
  addReview,
};
