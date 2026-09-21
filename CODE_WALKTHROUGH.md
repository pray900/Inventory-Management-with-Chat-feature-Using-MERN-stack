# Code walkthrough

This document goes through every source file in the project and explains what each line is doing and why. It is the companion to [README.md](README.md), which covers the architecture and the main flows. Read that one first if you want the shape of the system. Read this one when you want to understand a specific file.

Files are covered in dependency order rather than alphabetically, so nothing is explained before the thing it depends on. Styling files are grouped at the end, since they contain no logic.

## Contents

- [Backend](#backend)
  - [configs/index.js](#configsindexjs)
  - [db_init.js](#db_initjs)
  - [constants/roles.js](#constantsrolesjs)
  - [utils/AppError.js](#utilsapperrorjs)
  - [utils/catchAsync.js](#utilscatchasyncjs)
  - [utils/mailer.js](#utilsmailerjs)
  - [models/user.model.js](#modelsusermodeljs)
  - [models/notification.model.js](#modelsnotificationmodeljs)
  - [components/products/product.model.js](#componentsproductsproductmodeljs)
  - [middlewares/authentication.js](#middlewaresauthenticationjs)
  - [middlewares/authorization.js](#middlewaresauthorizationjs)
  - [middlewares/ownership.js](#middlewaresownershipjs)
  - [middlewares/uploader.js](#middlewaresuploaderjs)
  - [middlewares/notFound.js](#middlewaresnotfoundjs)
  - [middlewares/errorHandler.js](#middlewareserrorhandlerjs)
  - [validators/validate.js](#validatorsvalidatejs)
  - [validators/auth.validator.js](#validatorsauthvalidatorjs)
  - [validators/user.validator.js](#validatorsuservalidatorjs)
  - [validators/product.validator.js](#validatorsproductvalidatorjs)
  - [helpers/map_user_req.js](#helpersmap_user_reqjs)
  - [controllers/auth.controller.js](#controllersauthcontrollerjs)
  - [controllers/users.controller.js](#controllersuserscontrollerjs)
  - [controllers/notification.controller.js](#controllersnotificationcontrollerjs)
  - [controllers/contact.controller.js](#controllerscontactcontrollerjs)
  - [components/products/product.query.js](#componentsproductsproductqueryjs)
  - [components/products/product.controller.js](#componentsproductsproductcontrollerjs)
  - [components/products/product.route.js](#componentsproductsproductroutejs)
  - [routes/api.route.js](#routesapiroutejs)
  - [sockets/chat.socket.js](#socketschatsocketjs)
  - [app.js](#appjs)
- [Frontend](#frontend)
  - [index.jsx](#indexjsx)
  - [utils/notify.js](#utilsnotifyjs)
  - [utils/dateUtil.js](#utilsdateutiljs)
  - [utils/error.handler.js](#utilserrorhandlerjs)
  - [utils/httpClient.js](#utilshttpclientjs)
  - [constants/roles.js](#constantsrolesjs-1)
  - [services/redirection.js](#servicesredirectionjs)
  - [store.js](#storejs)
  - [slices/productSlice.js](#slicesproductslicejs)
  - [components/app.component.jsx](#componentsappcomponentjsx)
  - [components/app.routing.jsx](#componentsapproutingjsx)
  - [Auth: Login](#componentsauthloginlogincomponentjsx)
  - [Auth: Register](#componentsauthregisterregistercomponentjsx)
  - [Auth: ForgotPassword](#componentsauthforgotpasswordforgotpasswordcomponentjsx)
  - [Auth: ResetPassword](#componentsauthresetpasswordresetpasswordcomponentjsx)
  - [Common: Header](#componentscommonheaderheadercomponentjsx)
  - [Common: Sidebar](#componentscommonsidebarsidebarcomponentjsx)
  - [Common: Loader, Footer, PageNotFound](#componentscommonloader-footer-pagenotfound)
  - [Common: Pagination](#componentscommonpaginationpaginationcomponentjsx)
  - [Common: PasswordInput](#componentscommonpasswordinputpasswordinputcomponentjsx)
  - [Common: SubmitButton](#componentscommonsubmitbuttonsubmitbuttoncomponentjsx)
  - [Products: ProductForm](#componentsproductsproductformproductformcomponentjsx)
  - [Products: AddProduct](#componentsproductsaddproductaddproductcomponentjsx)
  - [Products: EditProduct](#componentsproductseditproducteditproductcomponentjsx)
  - [Products: ViewProducts](#componentsproductsviewproductsviewproductscomponentjsx)
  - [Products: SearchProduct](#componentsproductssearchproductsearchproductcomponentjsx)
  - [Products: ProductDetailsLanding](#componentsproductsproductdetailslandingproductdetailslandingcomponentjsx)
  - [Products: Details](#componentsproductsproductdetailslandingdetailsdetailscomponentjsx)
  - [Products: AddReview](#componentsproductsproductdetailslandingaddreviewaddreviewcomponentjsx)
  - [Users: Chat](#componentsuserschatchatcomponentjsx)
  - [Users: Notifications](#componentsusersnotificationsnotificationscomponentjsx)
  - [Admin](#componentsadminadmincomponentjsx)
  - [Settings](#componentssettingssettingscomponentjsx)
  - [Contact](#componentscontactcontactcomponentjsx)
  - [About](#componentsaboutaboutcomponentjsx)
  - [styles/_variables.scss](#styles_variablesscss)
  - [styles/theme.scss](#stylesthemescss)
  - [Component CSS files](#component-css-files)

---

# Backend

## configs/index.js

Every environment variable the backend needs is read here and nowhere else. Files that need a value import this module instead of touching `process.env` themselves.

```js
if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not set. Copy .env.example to .env and set a real secret.",
  );
}
```

This runs the moment the module is first imported, which happens during startup. Throwing here stops the process immediately with a clear message.

The alternative would be to fall back to some default secret. That would be much worse. The app would start, appear to work, and sign every token with a value an attacker could guess, letting them forge a token for any user including an admin. A missing signing key is not a situation to recover from gracefully, so the code refuses to run at all.

```js
module.exports = {
  PORT: process.env.PORT || 4040,
```

The `||` gives a default when the variable is absent. Reading `PORT` from the environment rather than hardcoding it is what lets a host assign its own port, which Render and most platforms do.

```js
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/marketlydb",
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
```

`JWT_SECRET` has no default, because the check above guarantees it exists. The rest default to local development values, which is what lets a new developer clone the repository and run it with almost no configuration.

```js
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
```

Worth pausing on. Everything in `process.env` is a string, always. `"587"` is not `587`, and Nodemailer expects a number. Forgetting this conversion is a classic source of confusing bugs, because the string looks right when you log it.

```js
  SMTP_FROM:
    process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@marketly.local",
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || process.env.SMTP_USER || "",
```

Chained fallbacks. Use the explicit sender if given, otherwise reuse the SMTP username, otherwise a placeholder. This saves configuring three variables that are usually the same address.

## db_init.js

Opens the MongoDB connection.

```js
const mongoose = require("mongoose");
const configs = require("./configs");

mongoose.set("strictQuery", true);
```

`strictQuery` tells Mongoose to strip query fields that are not in the schema. Without it, a typo like `UserModel.find({ usrname: 'bob' })` is sent to MongoDB as written, matches nothing, and returns an empty array with no complaint. Setting it globally here means every query in the app gets the protection.

```js
async function connectDB() {
  try {
    await mongoose.connect(configs.MONGO_URI);
    console.log("db connection successful");
  } catch (err) {
    console.error("error in db connection >>>", err);
    process.exit(1);
  }
}
```

`await` on `connect` means this function does not resolve until the connection is established. If it fails, the error is logged and the process exits with code 1, which by convention means failure.

Exiting is the right response. An API that cannot reach its database can serve no useful request, so failing immediately and visibly is better than accepting traffic and erroring on every single call. Hosting platforms also watch the exit code and will report the service as failed, which is exactly the signal you want.

```js
module.exports = connectDB;
```

The function is exported rather than called, so [app.js](api/app.js) decides when it runs.

## constants/roles.js

```js
module.exports = {
    ADMIN: 1,
    USER: 2,
    VISITOR: 3
}
```

Three lines that prevent a whole category of bug. Without this file the codebase would be full of `if (user.role === 1)`, and nobody reading it six months later would remember what `1` meant. Worse, a typo like `=== 11` looks fine at a glance, whereas `ROLES.ADMNI` is caught instantly because it evaluates to `undefined`.

`web/src/constants/roles.js` holds an identical copy for the frontend. The two must stay in step, which is the small cost of the numbers being shared across the stack.

## utils/AppError.js

```js
class AppError extends Error {
    constructor(status, msg) {
        super(msg);
        this.status = status;
        this.msg = msg;
    }
}
```

A custom error type carrying an HTTP status code alongside the message.

`extends Error` matters. It means `AppError` is a real error with a proper stack trace, and it can be tested with `instanceof`, which is exactly what the error handler does to tell a deliberate failure apart from an unexpected crash.

`super(msg)` calls the parent constructor so `.message` is populated the normal way. The extra `this.msg` is a convenience so both `err.message` and `err.msg` work, since the error handler and the frontend both use `msg`.

Used like this throughout the codebase:

```js
next(new AppError(404, 'Product Not Found'));
```

## utils/catchAsync.js

```js
module.exports = function catchAsync(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(next);
    }
}
```

Three lines that remove a `try/catch` from every route handler in the project.

The problem it solves: Express catches errors thrown synchronously, but it cannot see a rejected promise. An async handler that throws will crash the process or hang the request. The standard fix is to wrap every handler body in `try/catch` and call `next(err)` in the catch, which is a lot of repeated code.

This does it once. `catchAsync` takes a handler and returns a new one. Express calls the returned function, which calls the original and attaches `.catch(next)` to the promise it returns. Any rejection is passed to `next`, which sends it to the error handler.

Passing `next` directly to `.catch` works because `.catch` calls its argument with the error, which is exactly the signature `next` expects. It is shorthand for `.catch(err => next(err))`.

## utils/mailer.js

```js
let transporter = null;
if (configs.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: configs.SMTP_HOST,
    port: configs.SMTP_PORT,
    secure: configs.SMTP_PORT === 465,
    auth: {
      user: configs.SMTP_USER,
      pass: configs.SMTP_PASS,
    },
  });
}
```

The transporter is created only if SMTP is configured, so `transporter` stays `null` in a default local setup.

`secure: configs.SMTP_PORT === 465` encodes an SMTP convention. Port 465 expects TLS from the first byte. Port 587 starts unencrypted and upgrades via STARTTLS, which Nodemailer handles when `secure` is false. Getting this backwards produces a connection that hangs rather than a clear error, so deriving it from the port removes a setting people get wrong.

```js
async function sendMail({ to, subject, html }) {
  if (!transporter) {
    console.warn(
      "[mailer] SMTP not configured — email not sent. Would have sent:",
    );
    console.warn(
      `[mailer] to: ${to}\n[mailer] subject: ${subject}\n[mailer] body: ${html}`,
    );
    return;
  }
```

This is the part worth copying into your own projects. With no SMTP configured, the function logs the message and returns normally instead of throwing.

The effect is that password reset works end to end on a fresh clone with zero configuration. You request a reset, the API prints the link to its console, you paste it into the browser, and the rest of the flow runs exactly as it would in production. The alternative, throwing when email is unavailable, would make the entire feature untestable until somebody sets up a mail account.

Note the destructured parameter `{ to, subject, html }`. Calls read as `sendMail({ to: ..., subject: ... })`, which is self documenting at the call site.

## models/user.model.js

The Mongoose schema for an account. A schema defines which fields exist, their types, and their rules, which is what gives a schemaless database structure.

```js
    username: {
        type: String,
        required: true,
        unique: true
    },
```

`required` makes Mongoose reject a save without it. `unique` is different: it is not a validation rule but an instruction to create a unique index in MongoDB. Enforcement happens in the database, and a duplicate surfaces as error code 11000 rather than a validation error, which is why the error handler has a separate branch for it.

```js
    email: {
        type: String,
        unique: true,
        sparse: true
    },
```

Email is optional but must be unique when present. `sparse` is what makes that combination work: the index skips documents where the field is absent. Without it, the second user with no email would collide with the first, since both would index as `null`.

```js
    password: {
        type: String,
        required: true,
        select: false
    },
```

`select: false` excludes this field from query results unless explicitly requested. So `UserModel.findById(id)` returns a user with no password attached, and only login asks for it with `.select('+password')`.

This is defence in depth. The controller also strips the password before responding, but this means that even a forgotten strip cannot leak a hash, because it was never loaded.

```js
    address: {
        permanentAddress: String,
        temporaryAddress: [String]
    },
```

A nested object, stored as a sub document. `[String]` is an array of strings, since somebody may have several temporary addresses.

```js
    gender: {
        type: String,
        enum: ['male', 'female', 'others']
    },
```

`enum` restricts the value to that list. Anything else fails validation. This is also the reason the mapping helpers skip empty strings: an unselected radio arrives as `''`, which is not in the list and would throw.

```js
    role: {
        type: Number, // 1 = admin, 2 = general user, 3 = visitor
        default: 2
    },
```

The default is what makes every new registration an ordinary user. Combined with `role` being absent from the mapping helper, there is no way to register as an admin.

```js
    isArchived: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: 'active'
    },
```

Two similar looking fields with different importance. `status` is checked at login and blocks access when set to `inactive`. `isArchived` is stored but not currently enforced anywhere. The admin panel deliberately toggles `status`, and says so in a comment, because that is the one that does something.

```js
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    }
```

Hidden by default for the same reason as the password. These hold a hash of the reset token and its expiry.

```js
}, {
    timestamps: true
})
```

`timestamps` adds `createdAt` and `updatedAt` automatically and keeps them current. The product list sorts and displays these.

```js
const UserModel = mongoose.model('user', UserSchema)
```

Registers the model under the name `user`. Mongoose pluralises and lowercases that to derive the collection name, so documents land in `users`. The same name is what `ref: 'user'` points at elsewhere.

## models/notification.model.js

```js
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
```

A reference to another document. `ObjectId` stores the id, and `ref` tells Mongoose which model it belongs to so that `.populate()` can fetch it later. This is the equivalent of a foreign key.

This is the opposite design choice from reviews, which are embedded inside their product. Notifications are referenced because they are queried on their own, filtered by user and paginated, none of which works if they are buried inside a user document.

```js
    type: {
        type: String,
        default: 'review'
    },
```

Only review notifications exist today, but the field leaves room for more without a schema change.

```js
    message: {
        type: String,
        required: true
    },
```

The message text is stored already rendered, rather than assembled at read time from the type and related ids. That makes reading cheap and keeps old notifications accurate even if the product is later renamed.

```js
    read: {
        type: Boolean,
        default: false
    }
```

Drives the unread badge in the sidebar and the styling of each row.

## components/products/product.model.js

This file defines two schemas.

```js
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
```

`min` and `max` constrain the rating to a five point scale, enforced by Mongoose on save.

This schema is never registered as a model, because reviews are not stored on their own. It exists purely to describe the shape of the objects inside the product's `reviews` array.

```js
const ProductSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
```

`description: String` is shorthand for `{ type: String }`, used wherever a field has no rules beyond its type.

```js
    vendor: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    images: [String],
```

`vendor` is the ownership link that `isVendorOrAdmin` checks. `images` holds filenames only, never the file contents. The bytes live on disk and the database stores pointers to them.

```js
    status: {
        type: String,
        enum: ['available', 'out-of-stock', 'booked'],
        default: 'available'
    },
    reviews: [reviewSchema],
```

`[reviewSchema]` embeds the review shape defined above. Each review is stored inside the product document itself.

Embedding suits reviews because they are always read with their product and never queried independently. One database round trip fetches a product and everything attached to it. The limit is MongoDB's 16MB document cap, which a product would need a very large number of reviews to approach.

```js
    discount: {
        discountedItem: Boolean,
        discountType: {
            type: String,
            enum: ['percentage', 'quantity', 'value']
        },
        discountValue: String
    },
```

A nested object grouping three related fields. The form flattens these into `discountedItem`, `discountType` and `discountValue`, and the mapping helper reassembles them, which is why that helper has a dedicated section for the discount.

```js
    tags: [String],
    offers: [String],
```

Arrays that the form sends as comma separated text. Splitting happens in the mapping helper.

The schema also carries a commented out `attribute` field and a `warrentyStatus` spelling that is consistent throughout the codebase. Both are left as they are, since renaming a field that already has data in it requires a migration.

## middlewares/authentication.js

Turns a token into a user, or rejects the request.

```js
module.exports = catchAsync(async function (req, res, next) {
```

Wrapped in `catchAsync` because it does a database lookup and can reject.

```js
    let token;
    if (req.headers['authorization']) token = req.headers['authorization']
    if (req.headers['x-access-token']) token = req.headers['x-access-token']
    if (req.query['token']) token = req.query['token']
```

Three accepted sources, checked in order, so a later one overwrites an earlier one.

The `Authorization` header is the standard. `x-access-token` is a legacy convention some clients use. The query string exists because file uploads go through raw `XMLHttpRequest`, where setting a custom header is awkward, so the token rides in the URL instead.

That last one is a pragmatic compromise with a real cost. URLs appear in server access logs, proxy logs and browser history far more often than headers do, so a token sent this way is more likely to end up written down somewhere. It works, and it is worth knowing why it is there.

```js
    if (!token) {
        return next(new AppError(401, 'Authentication Failed, Token Not Provided'));
    }
```

401 means not authenticated, as distinct from 403 which means authenticated but not permitted. The codebase keeps that distinction consistently.

```js
    token = token.split(' ')[1] || token;
```

The header arrives as `Bearer eyJhbGciOi...`. Splitting on the space and taking index 1 strips the scheme. If there is no space, index 1 is `undefined` and the `|| token` fallback keeps the original, so a bare token also works.

```js
    let decoded;
    try {
        decoded = jwt.verify(token, configs.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
        return next(err);
    }
```

`jwt.verify` recomputes the signature from the header, payload and secret, and compares it to the signature on the token. Any tampering changes the payload and therefore the expected signature. It also checks `exp` and throws `TokenExpiredError` if the token is past its lifetime.

Pinning `algorithms: ['HS256']` matters more than it appears. A token declares its own algorithm in its header, and a library that trusts that declaration can be handed a token claiming `none`, which means no signature at all. Naming the accepted algorithm explicitly closes that attack.

The raw error is passed through rather than replaced, so the error handler can distinguish `JsonWebTokenError` from `TokenExpiredError` and produce a different message for each.

```js
    const user = await UserModel.findById(decoded._id);
    if (!user) {
        return next(new AppError(404, 'User removed from system'));
    }

    req.user = user;
    next();
```

The token already contains the user id, username and role, so this extra query is a deliberate cost. It buys two things. A deleted account stops working immediately rather than lingering until its token expires, and `req.user` is a full Mongoose document with every current field, not the three that were copied into the token at login.

Attaching to `req` is the standard way middleware passes information forward. Every handler downstream can rely on `req.user` existing.

## middlewares/authorization.js

```js
module.exports = function restrictTo(...allowedRoles) {
    return function (req, res, next) {
        if (allowedRoles.includes(req.user.role)) {
            return next();
        }
        next(new AppError(403, "Authorization Failed! You Dont have access"));
    }
}
```

A function that returns a middleware. This pattern is worth recognising because it appears throughout Express ecosystems.

Middleware must have the signature `(req, res, next)`, which leaves no room for extra arguments. So instead of passing the allowed roles to the middleware, you call a factory with them and it hands back a middleware that has those roles captured in a closure. `restrictTo(ROLES.ADMIN)` runs once when the route is defined. The function it returns runs on every request.

The rest parameter `...allowedRoles` collects any number of arguments into an array, so `restrictTo(ROLES.ADMIN, ROLES.USER)` works without changing anything.

`includes` uses strict equality, which is the detail to remember. The number `1` and the string `"1"` are different values, so a role stored as a string never matches. That is the usual explanation for an admin account that looks correct in the database but has no access, and it typically happens after editing a role by hand in a database GUI that defaults new values to String.

This runs after `authenticate`, never before, because it reads `req.user.role`. The ordering is visible in each route definition.

## middlewares/ownership.js

Where `restrictTo` asks what rank someone holds, this asks whether a specific object is theirs.

```js
const isSelfOrAdmin = catchAsync(async function (req, res, next) {
    if (req.user.role === ROLES.ADMIN || String(req.user._id) === req.params.id) {
        return next();
    }
    next(new AppError(403, 'You can only access your own account'));
})
```

Admins pass unconditionally. Everyone else passes only when the id in the URL is their own.

`String(req.user._id)` is doing essential work. `req.user._id` is a Mongoose `ObjectId`, which is an object, while `req.params.id` is always a string parsed out of the URL. Comparing an object to a string with `===` is always false, so without the conversion no ordinary user could ever access their own profile. This is among the most common bugs in Mongoose codebases, and it fails in the confusing direction, appearing as a permissions problem rather than a type problem.

```js
const isVendorOrAdmin = catchAsync(async function (req, res, next) {
    const product = await ProductModel.findById(req.params.id);
    if (!product) {
        return next(new AppError(404, 'Product Not Found'));
    }
    if (req.user.role === ROLES.ADMIN || (product.vendor && String(product.vendor) === String(req.user._id))) {
        req.product = product;
        return next();
    }
    next(new AppError(403, 'You can only modify your own products'));
})
```

Ownership of a product cannot be judged from the URL alone, so this loads the document first. A missing product is a 404 and a foreign one is a 403, which are genuinely different situations.

`product.vendor &&` guards against a product with no vendor, which would otherwise compare `String(undefined)` and produce the string `"undefined"`. Both sides are wrapped in `String()` here, since both are ObjectIds.

`req.product = product` caches the loaded document on the request so the handler does not fetch it again. A small saving, and an example of middleware passing work forward rather than just permission.

## middlewares/uploader.js

Configures Multer, the library that parses `multipart/form-data` and writes uploaded files to disk.

```js
function imageFilter(req, file, cb) {
    const mime_type = file.mimetype.split('/')[0];
    if (mime_type === 'image') {
        cb(null, true)
    } else {
        req.fileTypeError = true;
        cb(null, false)
    }
}
```

A MIME type looks like `image/png`, so splitting on the slash and taking the first half gives the category. This accepts any image format without listing them individually.

The rejection path is the interesting part. It sets a flag on the request and calls back with `false`, meaning skip this file, rather than passing an error. Passing an error would abort the whole upload with a message that does not read well. Instead the file is quietly dropped and the handler checks the flag afterwards:

```js
if (req.fileTypeError) {
    return next(new AppError(406, 'Invalid File Format'));
}
```

The result is a clear message with a deliberate status code, at the cost of one flag.

```js
const file_storage = multer.diskStorage({
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    },
    destination: function (req, file, cb) {
        cb(null, path.join(process.cwd(), 'uploads/images'))
    }
})
```

`diskStorage` writes files to the filesystem. The timestamp prefix means two people uploading `photo.jpg` get different filenames instead of one overwriting the other.

`path.join` builds the path with the correct separator for the operating system, which is why this works on both Windows and Linux. `process.cwd()` is the directory the process was started from, so the API must be started from inside `api/` for this to resolve correctly.

This is also the line responsible for the deployment limitation described in the README. Writing to local disk works perfectly on a normal server and loses every file on a host with an ephemeral filesystem.

```js
module.exports = function (filterType) {
    const MAP_FILTER = {
        image: imageFilter,
        pdf: pdfFilter
    }
    const upload = multer({
        storage: file_storage,
        fileFilter: MAP_FILTER[filterType],
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB
        }
    })
    return upload;
}
```

Another factory. Calling it with `'image'` looks the filter up in a table and returns a configured Multer instance. Used as `require('./uploader')('image')` at the top of each file that needs it.

The lookup table avoids an if chain and makes adding a type a one line change. The size limit is enforced by Multer itself, which raises a `MulterError` that the error handler already translates into a 400.

Callers use one of two methods. `Uploader.single('image')` accepts one file and puts it on `req.file`. `Uploader.array('images')` accepts several under the same field name and puts them on `req.files`. The string must match the field name the client used when building its `FormData`.

## middlewares/notFound.js

```js
module.exports = function (req, res, next) {
    next(new AppError(404, 'Not Found'));
}
```

Registered after every route. Express tries middleware in order, so anything reaching this point matched nothing.

Converting the miss into an `AppError` rather than responding directly means unknown paths produce exactly the same JSON shape as every other error. A client never has to handle a 404 differently from a 403.

## middlewares/errorHandler.js

Every error in the application ends up here. Express identifies an error handler by its four parameters, and it must be registered last.

```js
module.exports = function (err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.status).json({ msg: err.msg, status: err.status });
    }
```

Deliberate errors first. These already carry a status and a message written for a human, so they pass straight through.

```js
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(function (e) { return e.message; });
        return res.status(400).json({ msg: messages.join(', '), status: 400 });
    }
```

Mongoose validation failures. The `errors` property is an object keyed by field name, so `Object.values` gets the individual failures and each has its own message. Joining them means a user who left three fields invalid sees all three at once rather than fixing them one at a time.

```js
    if (err.name === 'CastError') {
        return res.status(400).json({ msg: `Invalid value '${err.value}' for '${err.path}'`, status: 400 });
    }
```

A `CastError` means a value could not be converted to its schema type, most often a malformed id in the URL. Naming both the field and the offending value turns an opaque failure into something actionable.

```js
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];
        const value = field ? err.keyValue[field] : '';
        return res.status(409).json({ msg: `${value} is already taken (${field})`, status: 409 });
    }
```

11000 is MongoDB's duplicate key error, raised by the unique indexes on `username` and `email`. MongoDB reports which field and value collided in `keyValue`, so the response can say "bob is already taken (username)" rather than something generic. 409 Conflict is the correct status for this.

The `|| {}` guard prevents a crash if the shape ever differs between driver versions.

```js
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ msg: 'Invalid authentication token', status: 401 });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ msg: 'Session expired, please log in again', status: 401 });
    }
```

Two different causes that deserve two different messages. An expired token is normal and the user simply logs in again. An invalid token means something is actually wrong. This is why the authentication middleware forwards the original error instead of replacing it.

```js
    if (err.name === 'MulterError') {
        return res.status(400).json({ msg: 'File upload error: ' + err.message, status: 400 });
    }
```

Covers oversized files, unexpected field names and nameless fields. All of these are the client sending something wrong, so 400 is right. Without this branch they would fall through to a 500 and look like a server fault.

```js
    if (err.status) {
        return res.status(err.status).json({ msg: err.msg || err.message, status: err.status });
    }

    console.error('unhandled error >>', err);
    res.status(500).json({ msg: 'Internal Server Error', status: 500 });
}
```

A catch all for errors from libraries that set a status, then the final fallback. Note the asymmetry in the last two lines: the full error is logged to the server console, but the client receives only a generic sentence. That is intentional. Stack traces and database messages can reveal internal structure, so they belong in your logs and not in a response.

Every branch returns the same shape, `{ msg, status }`, with `msg` always a plain string. That consistency is what lets the frontend handler stay as short as it is.

## validators/validate.js

```js
module.exports = function (req, res, next) {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const message = errors.array().map(e => e.msg).join(', ');
    next(new AppError(400, message));
}
```

The bridge between `express-validator` and this project's error handling.

Validation rules do not stop a request when they fail. They record what went wrong on the request object, and something has to check afterwards. That is this file. It collects the results, passes through when there are none, and otherwise joins every message into one string and raises a 400.

Joining rather than reporting the first failure means a user fixing a form sees everything wrong with it at once.

Every validated route follows the same pattern, rules then `validate`:

```js
router.post('/register', Uploader.single('image'), registerValidator, validate, catchAsync(...))
```

## validators/auth.validator.js

```js
const registerValidator = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email address')
]
```

An array of rules, each reading as a sentence. `body('name')` selects a field from the request body, and the chained calls are the checks applied to it.

`trim()` is not only a check but a transformation. It strips surrounding whitespace from the stored value, so a username typed with a trailing space does not become a separate account.

`.withMessage()` sets the text the user sees, which is what makes the difference between "Invalid value" and "Username must be at least 3 characters".

`optional({ checkFalsy: true })` is the important one on the email rule. Plain `optional()` skips only `undefined`, but an untouched form field arrives as an empty string, which is present and would fail `isEmail`. `checkFalsy` widens the skip to cover empty strings, which is what actually makes a field optional in a web form.

Note that password is not trimmed, deliberately. Leading and trailing spaces are legitimate characters in a password and silently removing them would break a login later.

```js
const resetPasswordValidator = [
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
]
```

`custom` runs your own function when the built in checks do not cover the case. It receives the value and the request, which is what allows a comparison against another field. Returning false fails the rule.

## validators/user.validator.js

```js
const updateValidator = [
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email address'),
    body('phoneNumber').optional({ checkFalsy: true }).isNumeric().withMessage('Phone number must be numeric')
]
```

Deliberately minimal. Every field is optional because a profile update sends only what changed, so requiring anything would break partial updates.

Note what is absent. There is no rule about `role` or `status`, because validation is the wrong layer for that. Those fields are guarded by an explicit admin check in the controller, which is an authorisation decision rather than a formatting one.

## validators/product.validator.js

The most substantial validator, and the one that shows the pattern properly.

```js
const startOfToday = () => new Date(new Date().toDateString());
```

`toDateString()` drops the time portion, so this gives midnight this morning. Comparing against midnight rather than the current moment means a product expiring today is still valid, which is what a user expects.

```js
const sharedRules = [
    body('price').optional({ checkFalsy: true }).isFloat({ min: 0 })
        .withMessage('Price must be a number and cannot be negative'),
```

Every rule is optional, and the comment above the array explains why:

```js
// Rules that apply to BOTH create and update. Every field is optional here
// (each runs only if the value is present), so a partial update is fine while
// a create still gets the same checks.
```

An update sends only changed fields, so a required rule would reject it. A create gets its required fields from a separate array. One set of rules, two use cases, no duplication.

`isFloat({ min: 0 })` checks the type and the range together. Quantity uses `isInt` instead, since half a unit of stock makes no sense.

```js
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
```

Three checks chained on one field, running in order. First the format, then the value against today, then the value against another field in the same request.

These `custom` functions throw rather than returning false. Both work, and throwing lets the message live next to the condition that produced it instead of in a separate `.withMessage()` at the end of a long chain.

The cross field check reaches into `req.body.manuDate` through the second parameter. Note it guards with `req.body.manuDate &&` first, since an update might change the expiry date without resending the manufacture date.

```js
const createValidator = [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    ...sharedRules
];

const updateValidator = [
    ...sharedRules
];
```

The spread operator composes the two. Create is the two required fields plus everything shared. Update is just the shared rules. Adding a new rule to `sharedRules` applies it to both automatically.

## helpers/map_user_req.js

One of the most security relevant files in the project despite containing no obvious security code.

```js
// Note: `role`, `isArchived` and `status` are intentionally NOT handled
// here. They're privileged fields set explicitly by the controller only
// when the requester is an admin (see controllers/users.controller.js) —
// `status` in particular gates login (see auth.controller.js), so a
// self-edit must never be able to touch it.
```

The comment states the intent so nobody adds the missing fields later thinking they were forgotten.

The vulnerability this prevents is called mass assignment. The obvious way to apply an update is `Object.assign(user, req.body)`, which copies everything the client sent. If the client sent `{"name": "Bob", "role": 1}`, they have just made themselves an admin. Any field in the schema becomes writable by anyone who can reach the endpoint.

Hand mapping removes the whole class of problem. A field that is not listed cannot be set, and adding one is a deliberate act.

```js
function isProvided(value) {
    return value !== undefined && value !== '';
}
```

A field counts as provided when it is neither missing nor an empty string.

The empty string case is the one that matters, and the comment in the file explains it. An unfilled radio group or date input submits `''`. Assigning that to a typed field, such as the `gender` enum or a `Date`, raises a validation error instead of being ignored. Treating `''` as "not provided" makes an untouched optional field behave the way a user expects.

```js
module.exports = function (userData, user) {
    if (isProvided(userData.name))
        user.name = userData.name;
    if (isProvided(userData.username))
        user.username = userData.username;
```

One line per allowed field. Repetitive by design, and the repetition is the feature.

The function takes an existing document and mutates it, which is why the same helper serves both create and update. Registration passes a fresh `new UserModel({})`, and an update passes the document it just loaded.

```js
    if (!user.address)
        user.address = {};
    if (isProvided(userData.tempAddress))
        user.address.temporaryAddress = typeof (userData.tempAddress) === 'string'
            ? userData.tempAddress.split(',')
            : userData.tempAddress;
```

The address object is created if missing, since assigning to a property of `undefined` throws.

The type check handles a form sending `"home,office"` as one string while an API client might send a real array. Splitting only when it is a string means both work.

Both `tempAddress` and `temporaryAddress` are accepted, which is a small compatibility accommodation for two different field names used by different parts of the frontend.

## controllers/auth.controller.js

Everything to do with getting in and out of the application. This file is an Express router rather than a set of exported functions, which is why it is mounted directly.

```js
function hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}
```

A plain SHA-256 hash, used for password reset tokens. Note this is not bcrypt. Bcrypt is deliberately slow to make guessing a password expensive, but a reset token is 32 random bytes, which is far beyond guessing. Fast hashing is correct here and bcrypt would only add latency.

```js
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
```

Three fields go into the payload, chosen because they are what the app needs on nearly every request. More would mean a larger token sent with every call, and the payload is readable by anyone holding it, so nothing sensitive belongs here.

`expiresIn` writes an `exp` claim that `jwt.verify` checks automatically.

The consequence to remember: the role is a snapshot taken at login. Changing somebody's role in the database does not affect their current token.

```js
function stripPassword(userDoc) {
    const user = userDoc.toObject();
    delete user.password;
    return user;
}
```

`toObject()` converts a Mongoose document into a plain object, which is necessary because `delete` does not work on a Mongoose document's tracked properties.

This is belt and braces alongside `select: false` in the schema. Login loads the password deliberately, so it must be removed deliberately too.

### Login

```js
const user = await UserModel.findOne({ username: req.body.username }).select('+password');
if (!user) {
    return next(new AppError(400, 'This username is not registered'));
}
```

`+password` adds back the field the schema hides.

The error message here tells an attacker that a username does not exist, which is the same account enumeration weakness that the forgot password endpoint carefully avoids. A hardened version would return one message for both a bad username and a bad password. This is an inconsistency worth knowing about.

```js
const isMatched = await bcrypt.compare(req.body.password, user.password);
if (!isMatched) {
    return next(new AppError(400, 'Incorrect password'));
}
```

`bcrypt.compare` extracts the salt embedded in the stored hash, hashes the attempt with it, and compares the results. Hashing is one way, so the original password cannot be recovered from what is stored.

It is also `await`ed because bcrypt is intentionally slow. Running it synchronously would block the event loop and stall every other request.

```js
if (user.status === 'inactive') {
    return next(new AppError(400, 'Your account is disabled please contact system administrator for support'));
}
```

The check that makes the admin panel's deactivate button meaningful. It runs after the password check, so a disabled account does not leak its own existence to someone guessing passwords.

```js
const token = generateToken(user);
res.json({
    user: stripPassword(user),
    token
})
```

The user object is returned alongside the token so the frontend can show a username and make role decisions without decoding the JWT itself.

### Registration

```js
router.post('/register', Uploader.single('image'), registerValidator, validate, catchAsync(async function (req, res, next) {
```

Four middlewares before the handler. Multer must come first, because until it parses the multipart body `req.body` is empty and the validators would see nothing.

```js
    const newUser = new UserModel({});
    const newMappedUser = MAP_USER_REQ(request_data, newUser)
    newMappedUser.password = await bcrypt.hash(req.body.password, 10);
```

An empty document is created and the mapping helper fills in the permitted fields. The password is hashed separately, after mapping, because the helper copies it verbatim and it must not be stored that way.

`10` is the cost factor, meaning 2^10 rounds of key derivation. Higher is slower to attack and slower to use. Ten is the usual balance for a web application.

```js
    const saved = await newMappedUser.save();
    res.status(201).json(stripPassword(saved));
```

`save()` is where Mongoose runs schema validation, so a missing required field or a bad enum value throws here and the error handler translates it. A duplicate username throws 11000 from MongoDB itself.

201 Created is the correct status for a request that created a resource.

### Forgot password

```js
const genericResponse = { msg: 'If that email is registered, a password reset link has been sent.' };

if (!user) {
    return res.json(genericResponse);
}
```

The same response whether or not the account exists. Without this, the endpoint becomes a tool for discovering which addresses have accounts, simply by comparing responses. The wording is chosen to be honest while revealing nothing.

```js
const rawToken = crypto.randomBytes(32).toString('hex');
user.passwordResetToken = hashToken(rawToken);
user.passwordResetExpires = Date.now() + RESET_TOKEN_TTL_MS;
await user.save();
```

`crypto.randomBytes` is a cryptographically secure generator. `Math.random` is not and must never be used for anything security related, because its output is predictable from previous values.

The raw token is emailed and only its hash is stored. This means a database leak does not hand over working reset links, exactly as with passwords.

An expiry one hour out limits how long a token intercepted in an inbox stays useful.

```js
const resetUrl = `${configs.FRONTEND_URL}/reset_password/${rawToken}`;
```

Built from configuration, which is why `FRONTEND_URL` must be set correctly in production. Left at its default, reset emails point users at `localhost`.

### Reset password

```js
const hashedToken = hashToken(req.params.token);
const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
}).select('+passwordResetToken +passwordResetExpires');
```

The incoming token is hashed and looked up, since only hashes are stored.

Both conditions sit in one query. `$gt: Date.now()` requires the expiry to still be in the future, so an expired token simply matches nothing and needs no separate branch.

```js
if (!user) {
    return next(new AppError(400, 'Invalid or expired reset link, please request a new one.'));
}
```

One message for both causes, which avoids confirming that a token was ever valid.

```js
user.password = await bcrypt.hash(req.body.password, 10);
user.passwordResetToken = undefined;
user.passwordResetExpires = undefined;
await user.save();
```

Clearing both fields makes the link single use. Without this, the same link would keep working until its hour expired.

## controllers/users.controller.js

```js
router.route('/')
    .get(restrictTo(ROLES.ADMIN), catchAsync(async function (req, res) {
```

`router.route('/')` groups the methods for one path. Listing every account is admin only.

```js
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;
```

The pagination pattern used identically in three places.

Query parameters are always strings, so `Number()` converts. The `|| 1` covers both a missing parameter and a non numeric one, since `Number('abc')` is `NaN` which is falsy. `Math.max(..., 1)` then blocks zero and negatives, which would otherwise produce a negative `skip` and an error from MongoDB.

Three small guards on one line, each closing a way a hand written URL could break the query.

```js
        const [data, total] = await Promise.all([
            UserModel.find({}).sort({ _id: -1 }).skip(skip).limit(limit),
            UserModel.countDocuments({})
        ]);
```

`Promise.all` runs both queries concurrently rather than one after the other, so the request takes as long as the slower query rather than their sum. Destructuring unpacks the results in order.

`sort({ _id: -1 })` sorts descending by id. Because MongoDB ObjectIds begin with a timestamp, this is newest first without needing an index on a date field.

```js
        res.json({
            data,
            total,
            page,
            pages: Math.max(Math.ceil(total / limit), 1)
        });
```

`Math.ceil` rounds up, since 11 items at 10 per page is 2 pages. `Math.max(..., 1)` keeps the page count at 1 when there are no results, so the UI does not display "page 1 of 0".

```js
router.route('/:id')
    .get(isSelfOrAdmin, catchAsync(async function (req, res, next) {
```

Reading one account requires being that account or an admin.

```js
    .put(isSelfOrAdmin, Uploader.single('image'), updateValidator, validate, catchAsync(async function (req, res, next) {
```

Five stages. Permission, file parsing, validation rules, validation check, then the handler.

```js
        const oldImage = user.image;
        const request_data = req.body;
        if (req.file) {
            request_data.image = req.file.filename;
        }
        if (request_data.password) {
            request_data.password = await bcrypt.hash(request_data.password, 10);
        }
```

The previous avatar filename is captured before anything changes it, so it can be deleted later.

The password is hashed only when one was sent. The frontend omits the field entirely when the box is left blank, so an ordinary profile update leaves the password untouched.

```js
        if (req.user.role === ROLES.ADMIN) {
            if (request_data.role !== undefined) user.role = request_data.role;
            if (request_data.isArchived !== undefined) user.isArchived = request_data.isArchived;
            if (request_data.status !== undefined) user.status = request_data.status;
        }
```

The privileged fields, assigned directly rather than through the mapping helper, and only for an admin.

This is the second of two barriers. The helper cannot write these fields at all, and this block only runs for an admin. `isSelfOrAdmin` already let the user through to edit their own profile, so without this check they could include `role: 1` in that same request.

`!== undefined` rather than a truthiness check, because `false` and `0` are meaningful values here and a truthy test would skip them.

```js
        const mappedUpdatedUser = MAP_USER_REQ(request_data, user)
        const updated = await mappedUpdatedUser.save();
        res.json(updated);

        if (req.file && oldImage) {
            fs.unlink(path.join(process.cwd(), 'uploads/images', oldImage)).catch(() => {});
        }
```

The response is sent before the old file is deleted, and the deletion is not awaited. Cleanup is housekeeping, so the user should not wait for it and should not see an error if it fails.

`.catch(() => {})` swallows the failure deliberately. A missing file is not a problem worth reporting, and an unhandled rejection would crash the process.

```js
    .delete(restrictTo(ROLES.ADMIN), catchAsync(async function (req, res, next) {
        const removed = await UserModel.findByIdAndDelete(req.params.id);
```

Admin only. Note that this does not delete the user's products or notifications, which would be left pointing at an id that no longer exists. Cleaning those up is a real gap.

## controllers/notification.controller.js

Mounted behind `authenticate`, so `req.user` is always present.

```js
const condition = { user: req.user._id };
```

The whole security model of this file in one line. Every query is scoped to the logged in user, so there is no way to read somebody else's notifications by changing a parameter.

```js
const [data, total, unreadCount] = await Promise.all([
    NotificationModel.find(condition).sort({ _id: -1 }).skip(skip).limit(limit).populate('product', { name: 1 }),
    NotificationModel.countDocuments(condition),
    NotificationModel.countDocuments({ user: req.user._id, read: false })
]);
```

Three queries at once. The page of results, the total for pagination, and the unread count for the sidebar badge.

`.populate('product', { name: 1 })` follows the `ref` on the product field and replaces the stored id with the actual document, while `{ name: 1 }` is a projection limiting it to the name. Fetching an entire product to display one word would be wasteful.

```js
router.put('/read-all', catchAsync(async function (req, res) {
    await NotificationModel.updateMany({ user: req.user._id, read: false }, { read: true });
```

`updateMany` does the work in the database in a single operation rather than loading documents and saving them one by one. The filter includes `read: false` so already read rows are not rewritten.

Route ordering matters here. `/read-all` is registered before `/:id/read`, and it must be, since `:id` is a wildcard that would otherwise match the literal string `read-all` first.

```js
const notification = await NotificationModel.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
);
```

The filter names both the notification id and the owner. Combining both conditions means marking somebody else's notification as read finds nothing and returns a 404, rather than succeeding. Checking ownership inside the query is stronger than fetching first and comparing afterwards, because there is no window between the two steps.

`{ new: true }` makes Mongoose return the updated document rather than the original, which is the default and rarely what you want.

## controllers/contact.controller.js

The smallest controller in the project.

```js
const contactValidator = [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required')
]
```

Defined inline rather than in the validators folder, since these two rules are used nowhere else.

```js
router.post('/', contactValidator, validate, catchAsync(async function (req, res) {
    await sendMail({
        to: configs.CONTACT_EMAIL || configs.SMTP_FROM,
        subject: `[Contact] ${req.body.subject}`,
        html: `<p>From: ${req.user.username} (${req.user.email || 'no email'})</p><p>${req.body.message}</p>`
    });
```

The sender identity comes from `req.user`, which the authentication middleware established, not from the request body. A user cannot claim to be somebody else.

The `[Contact]` prefix makes these easy to filter in an inbox.

One thing to be aware of: the message is interpolated into HTML without escaping, so a message containing tags would be rendered as markup in the recipient's email client. The route is authenticated and the recipient is the site owner, which limits the exposure, but escaping the input would be the correct fix.

## components/products/product.query.js

The data access layer for products. The controller calls these functions and never touches Mongoose directly, which keeps HTTP handling and database work separate.

```js
function isProvided(value) {
    return value !== undefined && value !== '';
}
```

The same guard as in the user helper, for the same reason. Empty strings from untouched form fields must not be written to typed schema paths.

```js
function map_product_req(productData, product) {
    if (isProvided(productData.name))
        product.name = productData.name;
```

The product equivalent of `map_user_req`, with the same explicit field by field mapping and the same protection against mass assignment.

```js
    if (productData.images !== undefined)
        product.images = productData.images;
```

Note this one checks only `undefined` rather than using `isProvided`. That is deliberate: an empty array is a meaningful value here, since removing every image should be possible.

```js
    if (productData.isReturnEligible !== undefined)
        product.isReturnEligible = productData.isReturnEligible === true || productData.isReturnEligible === 'true';
```

Booleans need care with multipart form data, because every value arrives as a string. The string `"false"` is truthy in JavaScript, so a naive assignment would make every checkbox true. This accepts either a real boolean or the exact string `"true"` and produces a real boolean from both.

```js
    if (productData.tags !== undefined)
        product.tags = typeof (productData.tags) === 'string' ? productData.tags.split(',').filter(Boolean) : productData.tags;
```

The form sends tags as `"new,sale,featured"`. Splitting produces an array, and `.filter(Boolean)` removes empty entries caused by a trailing comma or a double comma. Passing the `Boolean` constructor as the predicate is a compact idiom for dropping falsy values.

```js
    if (!product.discount)
        product.discount = {};
    if (productData.discountedItem !== undefined)
        product.discount.discountedItem = productData.discountedItem === true || productData.discountedItem === 'true';
```

The form flattens the discount fields, so they are reassembled into the nested object here. The object is created first, since assigning to a property of `undefined` throws.

```js
function find(condition) {
    return ProductModel
        .find(condition)
        .sort({ _id: -1 })
        .populate('vendor', {
            username: 1,
            email: 1
        })
        .populate('reviews.user', {
            email: 1
        })
}
```

Every read goes through this function, so the populated shape is identical everywhere. A single place to change if the requirements change.

`populate('vendor', {...})` replaces the stored ObjectId with the user document, projected down to two fields. The projection matters: without it the entire user record would be attached to every product in a list.

`populate('reviews.user', ...)` uses dot notation to reach inside the embedded array and populate a field on each element.

Note this returns a query rather than awaiting it, which is what lets callers chain `.skip()` and `.limit()` onto it.

```js
async function findPaginated(condition, page, limit) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        find(condition).skip(skip).limit(limit),
        ProductModel.countDocuments(condition)
    ]);
```

Builds on `find`, adding the page window and the count. The same condition feeds both, so the total always matches the filter.

```js
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
```

Load, map, then save, rather than a single atomic update. This is slower, but it is what runs the schema validators and it is what allows the mapping helper to apply its rules.

`concat` appends new images to the existing array rather than replacing it, which is why the field is named `newImages` and kept separate from `images`.

```js
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
```

Because reviews are embedded, adding one is an array push followed by saving the parent product. No separate collection and no join.

`map_review_data` renames the incoming fields, turning `reviewPoint` and `reviewMessage` from the form into `point` and `message` in the schema.

## components/products/product.controller.js

```js
const get = catchAsync(async function (req, res) {
  const condition = {};
  if (req.user.role !== ROLES.ADMIN) {
    condition.vendor = req.user._id;
  }
```

The filter that makes this a multi vendor marketplace. An admin sees everything. Everyone else sees only products where they are the vendor.

Note the direction of the check. It starts from an unfiltered condition and adds a restriction for non admins, which means a new role added later would be restricted by default rather than accidentally granted full visibility.

```js
const post = catchAsync(async function (req, res) {
  const data = req.body;
  if (req.files && req.files.length) {
    data.images = req.files.map(function (item) {
      return item.filename;
    });
  }
  data.vendor = req.user._id;
```

Multer has already saved the files, so `req.files` holds descriptions of them. Only the filenames are kept, since the database stores pointers and the disk stores bytes.

`data.vendor = req.user._id` overwrites anything the client may have sent for that field, so a product cannot be created in somebody else's name.

```js
const getById = catchAsync(async function (req, res, next) {
  const results = await productQuery.find({ _id: req.params.id });
  if (!results.length) {
    return next(new AppError(404, "Product Not Found"));
  }
  res.json(results[0]);
});
```

Uses `find` rather than `findById` so that the same populate configuration applies. `find` always returns an array, hence the length check and the index.

There is no ownership check on this route, so any logged in user can read any product by id. That is intentional, since reviewing a product requires seeing it.

```js
const update = catchAsync(async function (req, res) {
  const data = req.body;
  if (req.files && req.files.length) {
    data.newImages = req.files.map(function (item) {
      return item.filename;
    });
  }
```

`newImages` rather than `images`, which is what signals to the query layer that these should be appended rather than replace the existing list.

Ownership was already enforced by `isVendorOrAdmin` in the route, so the handler does not repeat the check.

```js
const search = catchAsync(async function (req, res) {
  const params = { ...req.query, ...req.body };
  const condition = {};
```

Merging query and body lets the same handler serve both GET and POST. Body values win, since they are spread second.

```js
  if (params.name) {
    condition.name = new RegExp(params.name, "i");
  }
```

A regular expression with the `i` flag for a case insensitive partial match, so "phone" finds "Smartphone".

```js
  if (params.color) {
    condition.color = new RegExp(`^${params.color}$`, "i");
  }
```

Anchored with `^` and `$` for a full match instead. A partial colour match would return noise.

Both of these interpolate user input straight into a regular expression, which means a crafted pattern could be expensive to evaluate. Escaping the input would be the correct hardening.

```js
  if (params.minPrice || params.maxPrice) {
    condition.price = {};
    if (params.minPrice) condition.price.$gte = Number(params.minPrice);
    if (params.maxPrice) condition.price.$lte = Number(params.maxPrice);
  }
```

Building the sub object first means either bound can be supplied alone.

```js
  if (params.tags) {
    const tags =
      typeof params.tags === "string" ? params.tags.split(",") : params.tags;
    condition.tags = { $in: tags };
  }
```

`$in` matches a document when its array shares any element with the supplied list.

```js
const addReview = catchAsync(async function (req, res) {
  const data = req.body;
  data.user = req.user._id;
  const response = await productQuery.addReview(req.params.productId, data);
  res.json(response);

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
```

The ordering is the lesson here. The response goes out first, and the notification is created afterwards without being awaited.

The comment in the file states the reasoning directly: the notification is a side effect of the review, not the point of the request, so a failure creating it must never surface as a failed review. If it throws, the error is logged and the user still sees their review succeed, because it did.

The `String()` comparison stops you being notified about your own review, and again both sides are converted because they are ObjectIds.

## components/products/product.route.js

Where every middleware discussed so far is assembled.

```js
router.route('/')
    .get(authenticate, productCtrl.get)
    .post(authenticate, Uploader.array('images'), createValidator, validate, productCtrl.post);
```

`Uploader.array('images')` accepts multiple files under one field name. The string must match what the client passes to `formData.append`.

Multer comes before the validators, and must, because `req.body` is empty until the multipart body has been parsed.

```js
router.route('/search')
    .get(productCtrl.search)
    .post(productCtrl.search)
```

The only product route with no `authenticate`, so search is publicly readable. Both methods point at the same handler, which is why it merges query and body.

Registered before `/:id`, which matters. Express matches in order, and `/:id` would otherwise capture the literal string `search` as an id.

```js
router.route('/:id')
    .get(authenticate, productCtrl.getById)
    .put(authenticate, isVendorOrAdmin, Uploader.array('images'), updateValidator, validate, productCtrl.update)
    .delete(authenticate, isVendorOrAdmin, productCtrl.remove);
```

The full chain reads as a sentence. Know who you are, prove this product is yours, accept the files, check the fields, do the work. Reading is open to any logged in user while writing requires ownership.

## routes/api.route.js

```js
router.use('/auth', authRoute);
router.use('/user', authenticate, userRoute);
router.use('/product', productRoute);
router.use('/notification', authenticate, notificationRoute);
router.use('/contact', authenticate, contactRoute);
```

The whole API surface in five lines, and the file worth reading first when finding your way around.

`/auth` has no guard, because you cannot present a token before you have one.

Three groups apply `authenticate` here at the mount point, which protects every route inside them at once. There is no way to add an unprotected route to those files by accident.

`/product` is the exception, since its routes have mixed requirements, so it applies authentication individually.

Combined with the `/api` prefix applied in `app.js`, `/auth` here becomes `/api/auth/login` in the browser.

## sockets/chat.socket.js

```js
const connectedUsers = new Map();
```

Who is currently online, held in memory. A `Map` rather than a plain object because keys stay in insertion order and iteration is straightforward.

In memory is the design limitation. Restarting the server empties it, and running two instances would give each its own copy, so a user connected to one would be invisible to the other. Making this survive either means moving it to Redis.

```js
function usersExcept(socketId) {
    return [...connectedUsers.entries()]
        .filter(([sid]) => sid !== socketId)
        .map(([, user]) => user);
}
```

Everyone except the given socket, since nobody needs to see themselves in the user list.

`[...map.entries()]` spreads the map into an array of `[key, value]` pairs. The filter destructures only the key, and the map destructures only the value, using a hole in the pattern to skip the first element.

```js
function broadcastUsers(io) {
    for (const socketId of connectedUsers.keys()) {
        io.to(socketId).emit('users', usersExcept(socketId));
    }
}
```

Each connection receives a list tailored to it, which is why this loops rather than broadcasting one identical payload.

```js
io.use(function (socket, next) {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication required'));
    }
    try {
        socket.user = jwt.verify(token, configs.JWT_SECRET, { algorithms: ['HS256'] });
        next();
    } catch (err) {
        next(new Error('Authentication failed'));
    }
});
```

`io.use` is Socket.IO's middleware, and the key difference from Express is that it runs once when the connection opens rather than on every message. A verified identity is then attached to the socket for its whole lifetime.

That is the right model for a long lived connection. Re verifying on every message would be wasted work, since the connection is already established and cannot change hands.

The same `algorithms` pinning appears here as in the HTTP middleware, for the same reason.

```js
io.on('connection', function (socket) {
    connectedUsers.set(socket.id, { id: socket.user._id, name: socket.user.username });
    broadcastUsers(io);
```

Keyed by `socket.id`, not by user id. One person with three tabs open has three sockets, and each must receive its own copy of every message.

The broadcast tells everyone already online that somebody new has arrived.

```js
    socket.on('new-message', function (payload) {
        const outgoing = {
            ...payload,
            senderId: socket.user._id,
            senderName: socket.user.username,
            time: Date.now()
        };
```

The security control of this file. The client's payload is spread first, then three fields are overwritten with values from the verified token.

Order is everything. Spread first, overwrite second, so whatever the client claimed about who it is gets replaced by what the token proves. Reversing those lines would let anyone send a message appearing to come from somebody else.

```js
        for (const [socketId, user] of connectedUsers.entries()) {
            if (user.id === payload.receiverId) {
                io.to(socketId).emit('reply-message', outgoing);
            }
        }
        socket.emit('reply-message-own', outgoing);
    });
```

The loop does not break on a match, deliberately, so every tab the recipient has open receives the message.

The sender gets their own copy back under a different event name. That is how the UI knows to render it on the right hand side without having to compare ids.

```js
    socket.on('disconnect', function () {
        connectedUsers.delete(socket.id);
        broadcastUsers(io);
    });
```

Socket.IO fires `disconnect` automatically on a closed tab, a navigation away or a dropped network. Removing the entry and rebroadcasting keeps everyone's user list current.

Nothing here writes to the database, which is why chat history does not survive a refresh.

## app.js

The file that assembles everything. Middleware order is the whole point, since Express runs them in the order they are registered.

```js
require("dotenv").config();
```

First line of the file, and it must be. It reads `.env` into `process.env`, so anything that reads configuration has to be imported after this runs.

```js
const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);
const corsOrigins = configs.CORS_ORIGIN.split(",").map((s) => s.trim());
```

`trust proxy` tells Express to read the client IP from `X-Forwarded-For`. Hosts such as Render terminate HTTPS at a proxy, so without this every request appears to come from the proxy and the rate limiter treats all users as one visitor. The value `1` means trust exactly one hop, which is correct for a single proxy. Setting it to `true` would trust the whole chain, letting a client forge the header.

`http.createServer(app)` instead of `app.listen`, because Socket.IO needs the underlying server object to attach to. An Express app is a request handler, not a server, and `app.listen` creates one internally and hides it.

The split on commas allows several allowed origins from one variable, trimmed so spaces after commas do not break matching.

```js
connectDB();
```

Called without `await`, which means the server can begin listening before the database is ready. In practice the connection completes in milliseconds and a failure exits the process, so this is a reasonable simplification rather than a problem.

```js
app.use(helmet());
app.use(cors({ origin: corsOrigins }));
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
```

The order here is deliberate.

Helmet first, so security headers are on every response including error responses.

CORS next, because a browser sends a preflight `OPTIONS` request before anything non trivial and it must be answered before other middleware wastes time on it.

Morgan third, logging each request in a compact development format.

The two body parsers last, since nothing before them needs a parsed body. `urlencoded` handles standard form posts and `json` handles API calls. Neither touches `multipart/form-data`, which is Multer's job at the route level.

```js
app.use(
  "/file",
  function (req, res, next) {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(process.cwd(), "uploads"))
);
```

Serves uploaded files, with one accommodation.

Helmet sets `Cross-Origin-Resource-Policy: same-origin` globally, which is a good default. But the frontend runs on a different origin, so the browser refuses to render these images even though the server sends them correctly. This relaxes the header for this route only, which is the narrowest fix available.

The URL prefix is `/file` while the folder is `uploads`, which is why `VITE_IMG_URL` ends in `/file/images/`.

```js
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter);
```

Twenty requests per IP per fifteen minutes on the auth routes, which is what makes password guessing impractical while staying far above normal use.

Applied only to `/api/auth`, since the rest of the API is already protected by requiring a token.

`standardHeaders` sends the modern `RateLimit-*` headers so a client can see its remaining budget. This is the middleware that depends on `trust proxy` being set correctly.

```js
app.use("/api", API_ROUTE);

app.use(notFound);
app.use(errorHandler);
```

The application routes, then the two handlers that must come last.

`notFound` catches anything no route matched, and it only works here at the end. Registered earlier it would intercept every request before the real routes had a chance.

`errorHandler` is last of all. Express recognises it as an error handler by its four parameters and routes every `next(err)` in the application to it.

```js
const io = new Server(server, {
  cors: { origin: corsOrigins },
});
initChatSocket(io);

server.listen(configs.PORT, function () {
  console.log("server listening at port " + configs.PORT);
  console.log("press CTRL + C to exit");
});
```

Socket.IO attaches to the same server, sharing the port with the REST API and reusing the same CORS origins.

`server.listen` rather than `app.listen`, since the server was created manually so that Socket.IO could attach to it.

---

# Frontend

Covered in dependency order: entry point, utilities, state, routing, then the screens themselves.

## index.jsx

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/theme.scss';
import { App } from './components/app.component'

const root = createRoot(document.getElementById('root'));
root.render(<App></App>);
```

The entry point, and the file `index.html` points at.

`createRoot` is the React 18 API, replacing the older `ReactDOM.render`. It enables concurrent rendering, which lets React interrupt and resume work rather than blocking until a render completes.

`document.getElementById('root')` finds the empty `<div id="root">` in `index.html`. Everything you see in the application is rendered inside that one element.

Importing the stylesheet from JavaScript looks odd if you have not used a bundler before. Vite intercepts it at build time, compiles the Sass, and injects the resulting CSS. The import is a build instruction rather than a runtime one.

## utils/notify.js

```js
import { toast } from 'react-toastify';

const showSuccess = (msg) => {
    toast.success(msg)
}
```

A thin wrapper around the toast library, exporting four functions that differ only in colour.

The wrapper earns its place by being the single point of contact with `react-toastify`. Swapping the library later means editing this file rather than the fifty call sites that use it. It also keeps call sites reading as `notify.showError(...)`, which says what is happening rather than which library is doing it.

## utils/dateUtil.js

```js
import dayjs from 'dayjs';
import relativeTimePlugin from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTimePlugin);
```

Day.js ships a small core and adds features through plugins, which keeps the bundle small. `relativeTime` is what provides phrasing like "3 hours ago", and it must be registered before use. Doing it here, at module level, means it runs once when the module first loads.

```js
export const formatDate = (date, format = 'YYYY-MM-DD') => {
    if (!date) return;
    return dayjs(date).format(format)
}
```

The guard returns `undefined` for a missing date rather than the string "Invalid Date", which is what Day.js would otherwise render into the page.

The default format is the one HTML date inputs require, which is why product and profile forms can pass a stored date straight into an input.

```js
export const relativeTime = (date, type = "hour") => {
    if (!date) return;
    return dayjs(date).startOf(type).fromNow();
}
```

`startOf(type)` rounds down before comparing, so timestamps within the same hour produce the same phrasing instead of flickering between "2 minutes ago" and "3 minutes ago". Chat passes `'minute'` for finer granularity, since chat messages are recent by nature.

## utils/error.handler.js

Every failed request in the application ends up here. It degrades through three stages, most specific first.

```js
const serverMsg = error && error.response && error.response.data && error.response.data.msg;
if (serverMsg) {
    const text = typeof serverMsg === 'object' ? extractDbErrorMessage(serverMsg) : serverMsg;
    return notify.showError(text);
}
```

The long chain of `&&` guards against every level being absent, since a network failure produces an error with no `response` at all.

This is the good case. The API replied in its standard `{ msg }` shape, so the message was written by the server for a human and is shown as is. That is why the backend error handler works so hard to produce clear strings.

The `typeof` check handles a legacy shape where `msg` was an object rather than a string.

```js
if (error && error.response) {
    const status = error.response.status;
    if (status === 429) {
        return notify.showError('Too many attempts. Please wait a minute and try again.');
    }
    return notify.showError(`Request failed (${status}). Please try again.`);
}
```

Second stage. Something responded but not in the expected shape, which happens with the rate limiter, since `express-rate-limit` sends its own 429 body without going through the error handler. Mapping the status to a sentence keeps the user informed.

```js
if (error && (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || ''))) {
    return notify.showError('The request timed out. Please try again.');
}
return notify.showError('Cannot reach the server. Please check that the API is running and try again.');
```

Third stage. No response arrived at all, so the only distinction left is between a timeout and an unreachable server. Axios signals a timeout with `ECONNABORTED`, and the regular expression is a fallback for wording that varies between versions.

That final message is more useful than it first appears. A dead API, a CORS misconfiguration and a sleeping free tier service all look identical to the browser, which reports them as a network failure with no detail. Naming the most likely cause points at the right place to look.

## utils/httpClient.js

Every HTTP call in the application goes through this file.

```js
const BASE_URL = import.meta.env.VITE_BASE_URL;

const http = axios.create({
    baseURL: BASE_URL,
    responseType: 'json',
    timeout: 20000,
    timeoutErrorMessage: 'Request Timeout'
})
```

`import.meta.env` is Vite's way of exposing environment variables, replacing the `process.env` you would use in Node. Only variables beginning with `VITE_` are exposed, which prevents a server secret from being bundled into public JavaScript.

`axios.create` makes a configured instance so the base URL and timeout are set once rather than at every call site.

The twenty second timeout is worth knowing about in deployment. A sleeping Render service takes around fifty seconds to wake, so the first request after an idle period gives up before the server has finished starting.

```js
const getHeaders = (isSecured = false) => {
    let options = {
        'Content-Type': 'application/json'
    }

    if (isSecured) {
        options['Authorization'] = `Bearer ${localStorage.getItem('token')}`
    }
    return options;
}
```

The token is read fresh on each call rather than captured once at module load. That matters, because a token captured at load would be stale after logging out and back in without a refresh.

`Bearer ` matches the scheme the authentication middleware strips on the server.

An interceptor would be the more idiomatic Axios approach, attaching the header automatically. The explicit flag is more verbose but makes it visible at each call site whether a request is authenticated.

```js
const GET = (url, isSecured = false, params = {}) => {
    return http.get(url, {
        headers: getHeaders(isSecured),
        params
    })
}
```

`params` is serialised into a query string by Axios, which handles escaping. Building the string by hand is where encoding bugs come from.

`POST` and `PUT` follow the same shape with a body argument, and `DELETE` matches `GET`.

```js
const UPLOAD = (method, url, data = {}, files = []) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
```

File uploads drop out of Axios entirely and use the browser's raw `XMLHttpRequest`, wrapped in a promise so callers see the same interface as every other method.

```js
        files.forEach(item => {
            if (item) formData.append('images', item, item.name)
        })

        for (let key in data) {
            if (key) formData.append(key, data[key])   // never send a nameless field
        }
```

Every file is appended under the same name, `images`, which is what lets `Uploader.array('images')` collect them server side. `FormData` allows repeated names, unlike a plain object.

The `if (key)` guard prevents an empty field name, which Multer rejects with an unhelpful error. That situation is easy to produce, since a file input with no `name` attribute can leave an empty key in the form state.

```js
        const parseBody = () => {
            try { return JSON.parse(xhr.responseText); } catch (e) { return undefined; }
        };
```

Raw XHR gives a string, not parsed JSON. The `try/catch` covers a non JSON response, such as an HTML error page from a proxy.

```js
        xhr.onload = () => {
            const body = parseBody();
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ data: body });
            } else {
                reject({ response: { status: xhr.status, data: body } });
            }
        };
```

The adapter layer, and the reason the shared error handler works uniformly.

`onload` fires for every completed response including a 500, because at the transport level the request succeeded. So the status has to be checked by hand, unlike Axios which rejects on error statuses automatically.

Both branches reshape the result to match Axios. Success resolves as `{ data }`, and failure rejects as `{ response: { status, data } }`. Without this, `ErrorHandler` would need a second code path for uploads.

```js
        xhr.onerror = () => reject({ message: 'Network Error' });
        xhr.ontimeout = () => reject({ code: 'ECONNABORTED', message: 'timeout' });
```

`onerror` fires only for a genuine transport failure. The `ECONNABORTED` code is chosen specifically to match what Axios emits, so the timeout branch in the error handler recognises it.

```js
        xhr.open(method, `${BASE_URL}${url}?token=Bearer ${localStorage.getItem('token')}`, true)
        xhr.send(formData)
```

The token goes in the query string here rather than a header, which is the case the authentication middleware accommodates with its third lookup.

Note that no `Content-Type` is set. That is deliberate and important. The browser must set it itself, because `multipart/form-data` requires a boundary parameter that only the browser knows. Setting the header manually omits the boundary and the server cannot parse the body.

## constants/roles.js

```js
export const ROLES = {
    ADMIN: 1,
    USER: 2,
    VISITOR: 3
}
```

A copy of the backend file, in ES module syntax. The two must stay in step, which is the small cost of sharing role numbers across a stack without a shared package.

## services/redirection.js

```js
export const redirectToDashboard = (role, navigate) => {
    let redirectPath = '/';
    switch (role) {
        case ROLES.ADMIN:
            redirectPath = '/admin'
            break;
        case ROLES.USER:
            redirectPath = '/dashboard'
            break;
        default:
            break;
    }
    navigate(redirectPath)
}
```

Chooses where to land after logging in, based on role.

`navigate` is passed in rather than obtained here, because `useNavigate` is a hook and hooks can only be called inside components. Taking it as an argument keeps this as a plain function that is easy to reason about and easy to test.

The `default` case leaves the path at `/`, so an unrecognised role goes back to login rather than somewhere unintended.

## store.js

```js
import { configureStore } from '@reduxjs/toolkit';
import { productReducer } from './slices/productSlice';

export const store = configureStore({
    reducer: {
        product: productReducer
    }
})
```

`configureStore` replaces the older `createStore` and sets up sensible defaults, including the Redux DevTools connection and middleware that warns about accidentally mutating state outside a reducer.

One reducer is registered, under the key `product`, which is why components read `state.product.products`.

Only products are in Redux, and that restraint is deliberate. Product data is read and written by several unrelated screens, which is exactly what a shared store is for. Notifications, the admin table and every form keep their state locally, because nothing outside those components needs it.

## slices/productSlice.js

```js
const initialState = {
    isLoading: false,
    isProductLoading: false,
    isReviewSubmitting: false,
    product: {},
    products: [],
    page: 1,
    pages: 1,
    total: 0
}
```

Three separate loading flags rather than one. The list, the single product and the review submission can be in flight independently, and sharing one flag would make an unrelated spinner appear.

```js
export const fetchProducts_ac = createAsyncThunk('product/fetchProducts', async (page = 1, { rejectWithValue }) => {
    try {
        const response = await httpClient.GET('/product', true, { page, limit: 10 })
        return response.data;
    } catch (err) {
        ErrorHandler(err)
        return rejectWithValue(err)
    }
})
```

`createAsyncThunk` takes an action name and an async function, and returns something you can dispatch. It automatically dispatches three actions on your behalf: `pending` when it starts, `fulfilled` with the returned value, and `rejected` if it throws.

The first argument is whatever you passed to the dispatch call. The second is a set of helpers provided by Redux Toolkit.

`ErrorHandler(err)` shows the toast, and `rejectWithValue(err)` then marks the thunk as rejected so the reducer can clear its loading flag. Both are needed, since one handles the user facing message and the other handles state.

```js
export const removeProduct_ac = createAsyncThunk('product/removeProduct', async (id, { rejectWithValue }) => {
    try {
        await httpClient.DELETE(`/product/${id}`, true)
    } catch (err) {
        ErrorHandler(err)
        return rejectWithValue(err)
    }
    notify.showInfo("Product Removed")
    return id;
})
```

Returning the id rather than nothing is what lets the reducer remove that row locally without refetching the whole list.

```js
export const addReview_ac = createAsyncThunk('product/addReview', async ({ reviewData, productId }, { dispatch, rejectWithValue }) => {
    try {
        await httpClient.POST(`/product/add_review/${productId}`, reviewData, true)
        dispatch(fetchProduct_ac({ id: productId, showLoader: false }))
```

A thunk dispatching another thunk. Posting a review does not return the updated product, so this refetches it to pick up the new entry.

The `showLoader: false` flag is the detail that shows real care about the experience, and the reducer honours it below.

```js
const productSlice = createSlice({
    name: 'product',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
```

`reducers` is empty because every action here is async. `extraReducers` is where you respond to actions defined elsewhere, which includes the ones the thunks generate.

```js
            .addCase(fetchProducts_ac.pending, (state) => {
                state.isLoading = true;
            })
```

This looks like it breaks the rule against mutating Redux state. It does not. Redux Toolkit runs reducers inside Immer, which hands you a draft object, records what you appear to change, and produces a new immutable state from the recording. You write the readable version and still get immutability.

```js
            .addCase(fetchProducts_ac.fulfilled, (state, action) => {
                state.isLoading = false;
                state.products = action.payload.data;
                state.total = action.payload.total;
                state.page = action.payload.page;
                state.pages = action.payload.pages;
            })
```

`action.payload` is whatever the thunk returned, which here is the paginated response, so the page numbers come from the server rather than being tracked separately on the client.

```js
            .addCase(removeProduct_ac.fulfilled, (state, action) => {
                state.products = state.products.filter(item => item._id !== action.payload);
            })
```

The deleted row disappears immediately, with no second request. `action.payload` is the id the thunk returned.

```js
            .addCase(fetchProduct_ac.pending, (state, action) => {
                if (action.meta.arg.showLoader !== false) {
                    state.isProductLoading = true;
                }
            })
```

`action.meta.arg` is the argument the thunk was dispatched with, which Redux Toolkit preserves on the action.

This is the flag in action. A normal page load sets the loading state and shows a spinner. The silent refetch after posting a review skips it, so the review list updates in place instead of the whole page blanking and redrawing. Same request, entirely different feel.

## components/app.component.jsx

```jsx
export const App = () => (
  <div>
    <Provider store={store}>
      <AppRouting></AppRouting>
      <ToastContainer></ToastContainer>
    </Provider>
  </div>
)
```

The root component, kept deliberately small.

`Provider` makes the Redux store available to every component beneath it through React context, which is what allows `useSelector` anywhere in the tree without passing the store down by hand.

`ToastContainer` is where toasts are actually rendered. Calling `toast.success(...)` anywhere adds to a queue, and this component displays it. It sits outside the router so a toast survives navigation.

## components/app.routing.jsx

Every route in the application, plus the three layout wrappers that enforce access.

```jsx
const AuthenticatedLayout = ({ children }) => (
    <div className="app-shell">
        <Header isLoggedIn={true}></Header>
        <div className="main">
            <Sidebar></Sidebar>
            <div className="content">
                {children}
            </div>
        </div>
        <Footer></Footer>
    </div>
)
```

The chrome for a logged in page: header, sidebar, content, footer. `children` is whatever the component wraps, which is how one layout serves every screen.

```jsx
const ProtectedRoute = ({ children }) => {
    if (!localStorage.getItem('token')) {
        return <Navigate to="/" replace></Navigate>
    }
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
```

The guard for a logged in page. Rendering `<Navigate>` performs a redirect, which is React Router's declarative alternative to calling a function.

`replace` swaps the current history entry instead of adding one, so the back button does not return to a page the user was just bounced from.

This checks only that a token exists, not that it is valid. An expired token passes here and fails at the API, which then returns 401 and the user sees a session expired message. That is the correct division: the client guard is for user experience, and the server is the real boundary.

```jsx
const AdminRoute = ({ children }) => {
    if (!localStorage.getItem('token')) {
        return <Navigate to="/" replace></Navigate>
    }
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (currentUser?.role !== ROLES.ADMIN) {
        return <Navigate to="/dashboard" replace></Navigate>
    }
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
```

Two checks, with different destinations. No token goes to login, wrong role goes to the dashboard, which tells the user something different in each case.

`|| 'null'` matters. `JSON.parse(null)` throws, and `localStorage.getItem` returns `null` for a missing key, so the string `'null'` gives `JSON.parse` something valid to chew on. Without it, a cleared storage crashes the whole app.

`currentUser?.role` is optional chaining, returning `undefined` rather than throwing when `currentUser` is null.

This is convenience, not security. Anyone can edit their stored user object and reach the admin screen. What they cannot do is make the API answer, because `restrictTo(ROLES.ADMIN)` checks the token server side. The admin page would simply render empty.

```jsx
<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
```

`BrowserRouter` uses the History API for clean URLs without a hash. The `future` flags opt in to React Router 7 behaviour early, which silences deprecation warnings and eases the eventual upgrade.

```jsx
<Route path="/" element={<PublicRoute><LoginComponent /></PublicRoute>}></Route>
<Route path="/register" element={<PublicRoute><RegisterComponent /></PublicRoute>}></Route>
```

Each route names a path and the element to render. The wrapper applies the layout and the guard together, so there is no way to add a protected route and forget the guard.

```jsx
<Route path="/reset_password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>}></Route>
```

The `:token` segment is a parameter, read inside the component with `useParams`. This path is what the backend builds into reset emails.

```jsx
<Route path="*" element={<PublicRoute><PageNotFound /></PublicRoute>}></Route>
```

The catch all, matching anything no earlier route did. It must be last, since routes are evaluated in order.

This is also the route that depends on `vercel.json`. React Router only sees a path once the app has loaded, so a direct visit to an unknown URL asks the server first. Without the rewrite, the host answers 404 and React never runs.

## components/Auth/Login/Login.component.jsx

```jsx
const [data, setData] = useState({ ...defaultForm });
const [error, setError] = useState({ ...defaultForm });
const [isSubmitting, setIsSubmitting] = useState(false);
const [rememberMe, setRememberMe] = useState(false);
```

Four pieces of local state. The spread creates a fresh copy of `defaultForm`, which matters because passing the object directly would share one instance across every mount and let one form's edits leak into the next.

Reusing the same shape for errors means `error.username` always exists, so no guard is needed when rendering it.

```jsx
useEffect(() => {
    if (localStorage.getItem('remember_me') === 'true') {
        navigate('/dashboard', { replace: true })
    }
}, [navigate])
```

Skips the login page for a returning user.

The comparison is against the string `'true'`, not the boolean, because `localStorage` stores only strings and `String(true)` is `'true'`. Comparing to a boolean would never match.

```jsx
const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
        return setRememberMe(checked)
    }
    setData(prev => {
        const next = { ...prev, [name]: value };
        if (error[name]) {
            validateForm(next);
        }
        return next;
    })
}
```

One handler for every input, dispatching on the `name` attribute. `[name]: value` is a computed property, using the variable's value as the key.

Checkboxes are handled separately, since their meaningful property is `checked` rather than `value`.

The `if (error[name])` condition is a small piece of interaction design. Validation reruns only for a field that is already showing an error, so a message disappears as you fix it, but a field you have not finished typing in does not start complaining early.

The updater form `setData(prev => ...)` is used rather than referencing `data` directly, which is the correct pattern when the new value depends on the old one.

```jsx
const submit = (e) => {
    e.preventDefault();
    setIsSubmitting(true)
    httpClient.POST(`/auth/login`, data)
        .then(response => {
            notify.showSuccess(`Welcome ${response.data.user.username}`)
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user))
            localStorage.setItem('remember_me', rememberMe)
            redirectToDashboard(response.data.user.role, navigate)
        })
        .catch(err => {
            ErrorHandler(err);
            setIsSubmitting(false)
        })
}
```

`e.preventDefault()` stops the browser's default form submission, which would reload the page and discard all React state.

Three values are stored. The token for authentication, the user object so the header and sidebar can render without another request, and the remember flag.

`JSON.stringify` is required because `localStorage` stores strings only. An object stored directly becomes the useless string `[object Object]`.

Note that `setIsSubmitting(false)` appears only in the catch. On success the component navigates away and unmounts, so resetting it would be a state update on an unmounted component.

## components/Auth/Register/Register.component.jsx

```jsx
const requiredFields = ['name', 'username', 'password', 'confirmPassword'];
```

A data driven list, so adding a required field is a one word change rather than another `if`.

Email is deliberately absent, matching the API which treats it as optional. Keeping the two in step prevents a form that refuses input the server would have accepted.

```jsx
const computeErrors = (d) => {
    const e = { ...defaultForm };
    requiredFields.forEach(field => {
        if (!String(d[field] || '').trim()) {
            e[field] = 'required field*';
        }
    });
    if (d.password && d.confirmPassword && d.password !== d.confirmPassword) {
        e.confirmPassword = 'password did not match';
    }
    return e;
}
```

One pure function computing the whole error object from the current data. Pure meaning it reads its input and returns a value without touching state, which makes it trivial to reason about.

`String(d[field] || '').trim()` handles three cases at once: a missing field, a non string value, and one containing only spaces.

The password comparison requires both to be filled before complaining, so the message does not appear while you are still typing the second one.

```jsx
const [hasSubmitted, setHasSubmitted] = useState(false);

const handleChange = e => {
    const { name, value } = e.target;
    setData(prev => {
        const next = { ...prev, [name]: value };
        if (hasSubmitted) setError(computeErrors(next));
        return next;
    })
}
```

The interaction pattern worth taking away from this file.

Before the first submit, nothing is validated, so a half filled form is not covered in red while you work through it. After the first submit, every keystroke revalidates, so each message clears as its field is corrected.

This is sometimes called touched state, and it is the difference between a form that helps and one that nags.

```jsx
const handleSubmit = e => {
    e.preventDefault();
    setHasSubmitted(true);
    const errs = computeErrors(data);
    setError(errs);
    if (Object.values(errs).some(Boolean)) {
        return;
    }
```

`Object.values(errs).some(Boolean)` asks whether any value is truthy, meaning any field has a message. Passing `Boolean` as the predicate is a compact idiom for a truthiness test.

Validation runs against `errs` rather than the state that was just set, because `setError` is asynchronous and the state variable would still hold the previous value on this line.

## components/Auth/ForgotPassword/ForgotPassword.component.jsx

```jsx
const handleChange = e => {
    const value = e.target.value;
    setEmail(value)
    setEmailErr(value
        ? (value.includes('@') && value.includes('.com') ? '' : 'invalid email')
        : 'required field*')
}
```

A single field, so plain state rather than an object.

The email check is naive and knowingly so. Requiring `.com` rejects `.org`, `.co.uk` and every other valid domain. It costs nothing here because the server validates properly with `isEmail()` and returns a clear message, so the worst case is a slightly premature warning. Worth recognising as a rough edge rather than a pattern to copy.

```jsx
httpClient.POST('/auth/forgot-password', { email })
    .then(() => {
        notify.showInfo("Password reset link sent to your email please check your inbox");
        navigate('/');
    })
```

The message is shown regardless of whether the address exists, which matches the server's deliberate refusal to confirm either way. Saying "no such account" here would undo that protection from the client side.

## components/Auth/ResetPassword/ResetPassword.component.jsx

```jsx
const { token: resetToken } = useParams();
```

`useParams` reads the `:token` segment from the URL. The destructuring renames it for clarity at the point of use.

```jsx
const validateForm = (fieldName, nextData) => {
    let errMsg;
    switch (fieldName) {
        case 'password':
            errMsg = nextData.confirmPassword
                ? (nextData.confirmPassword === nextData.password ? '' : 'password didnot match')
                : (nextData.password
                    ? (nextData.password.length > 8 ? '' : 'weak password')
                    : 'required field*')
            break;
```

Nested ternaries three levels deep. They work, but this is the least readable code in the project, and the same logic written as `if` statements would be considerably clearer. Worth noting honestly rather than presenting as a model.

The logic underneath is reasonable. If the confirmation field has content, check that the two match. Otherwise check length. Otherwise report it as required.

Note the length threshold is 8 here while the server requires 6, so the client is stricter than the API. Not harmful, but inconsistent.

```jsx
setError(prevError => {
    const nextError = { ...prevError, [fieldName]: errMsg };
    const errors = Object.values(nextError).filter(err => err);
    setIsValidForm(errors.length === 0)
    return nextError;
})
```

Calling `setIsValidForm` inside the `setError` updater is unusual. It works because the updater runs during the state update, but it makes the updater impure, which React's documentation advises against. Deriving `isValidForm` from `error` during render would be the cleaner approach, since it is computed data rather than independent state.

## components/Common/Header/Header.component.jsx

```jsx
const activeClass = ({ isActive }) => (isActive ? 'selected' : '');
```

`NavLink` accepts a function for `className` and calls it with the link's current state, which is how the active item is highlighted without tracking the current route by hand.

Defined outside the component so it is not recreated on every render.

```jsx
const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
```

Read during render rather than held in state. That means the header reflects `localStorage` at the moment it renders, but does not react to a change, which is why updating your profile in Settings writes back to `localStorage` and the header updates on the next navigation rather than immediately.

```jsx
const logout = () => {
    localStorage.clear();
    navigate('/')
}
```

`clear()` removes everything rather than deleting keys individually, so no stale value can survive a logout.

There is no server call, and there does not need to be. JWT authentication is stateless, so discarding the token is logging out. The token remains technically valid until it expires, which is the tradeoff stateless auth makes in exchange for needing no session store.

```jsx
const content = isLoggedIn
    ? <ul className="nav_list"> ... </ul>
    :
    <ul className="nav_list"> ... </ul>
```

Two navigation bars selected by prop. The layout wrappers pass `isLoggedIn`, so the header itself does not need to know how authentication works.

## components/Common/Sidebar/Sidebar.component.jsx

```jsx
useEffect(() => {
    httpClient.GET('/notification', true, { page: 1, limit: 1 })
        .then(response => setUnreadCount(response.data.unreadCount))
        .catch(() => {})
}, [])
```

Fetches the unread count for the badge.

`limit: 1` requests the smallest possible page, because only `unreadCount` is wanted and the notification list itself is discarded. The server computes that count separately from the page, so this is the cheapest way to ask.

`.catch(() => {})` swallows any failure deliberately. A badge is decoration, and a toast about it would be noise, especially on a page where the real content loaded fine.

The empty dependency array means this runs once when the sidebar mounts. The count therefore does not update live as notifications arrive, which is a known simplification.

```jsx
{currentUser?.role === ROLES.ADMIN && (
    <>
        <hr></hr>
        <NavLink to="/admin">Admin</NavLink>
    </>
)}
```

Conditional rendering with `&&`. When the left side is false, React renders nothing.

`<>...</>` is a fragment, grouping two elements without adding a wrapper element to the DOM.

Hiding the link is presentation only. The route is guarded by `AdminRoute` and the data by `restrictTo` on the server.

## components/Common/Loader, Footer, PageNotFound

Three small presentational components.

`Loader` renders a single div and lets CSS animate it. `Footer` renders a copyright line with `new Date().getFullYear()`, so the year never goes stale. `PageNotFound` shows an image and a link home, with the image loaded from `/images/notfound.jpg` in the `public` folder, which Vite copies to the build output untouched.

## components/Common/Pagination/Pagination.component.jsx

```jsx
export const Pagination = ({ page, pages, total, onChange }) => {
    if (pages <= 1) return null;
```

A controlled component, holding no state of its own. It receives the current position and reports clicks upward, which lets three different screens use it with completely different data sources.

Returning `null` renders nothing, so a single page of results shows no pagination at all.

```jsx
<button
    className="btn btn-outline-secondary btn-sm me-2"
    disabled={page <= 1}
    onClick={() => onChange(page - 1)}
>
    Prev
</button>
```

The `disabled` attribute is derived from the data rather than tracked separately, so it cannot fall out of step.

```jsx
Pagination.propTypes = {
    page: PropTypes.number.isRequired,
    pages: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
}
```

`propTypes` gives runtime warnings in development when a prop is missing or the wrong type. It is the lightweight alternative to TypeScript, catching a subset of the same mistakes at the component boundary.

## components/Common/PasswordInput/PasswordInput.component.jsx

```jsx
const [show, setShow] = useState(false);

<input
    type={show ? 'text' : 'password'}
```

The entire mechanism. Toggling the input's `type` between `password` and `text` is what reveals the characters.

```jsx
<span
    role="button"
    tabIndex={0}
    aria-label={show ? 'Hide password' : 'Show password'}
    onClick={() => setShow(s => !s)}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShow(s => !s); } }}
>
```

The accessibility handling here is better than most implementations and worth copying.

A `span` is not focusable or interactive by default. `role="button"` tells assistive technology what it is, `tabIndex={0}` puts it in the keyboard tab order, `aria-label` gives it a name that changes with its state, and `onKeyDown` makes Enter and Space work the way they would on a real button.

`e.preventDefault()` in the key handler stops Space from scrolling the page.

`setShow(s => !s)` uses the updater form, which is the correct way to toggle from a previous value.

## components/Common/SubmitButton/SubmitButton.component.jsx

```jsx
export const SubmitButton = ({ enabledLabel, disabledLabel, isSubmitting, isDisabled }) => {
    return isSubmitting
        ? <button disabled className="btn btn-info" >{disabledLabel || 'Submitting...'}</button>
        : <button disabled={isDisabled} type="submit" className="btn btn-primary" >{enabledLabel || 'Submit'}</button>
}
```

Used by every form in the application, which is why no form in this project can be double submitted.

While submitting, the button is disabled and shows a progress label. The `|| 'Submitting...'` fallback means callers can pass nothing and still get sensible text.

Note the submitting variant omits `type="submit"`, so even if the disabled state were somehow bypassed the button would not trigger another submission.

## components/Products/ProductForm/ProductForm.component.jsx

The largest component in the project, shared by both Add and Edit.

```jsx
export const ProductForm = ({ isEdit, isSubmitting, productData, submitCallback }) => {
```

The shared form takes a callback rather than performing the request itself. Add and Edit each pass their own, which is what lets one form serve two very different operations.

```jsx
const [filesToUpload, setFilesToUpload] = useState([]);
const [filesToPreview, setFilesToPreview] = useState([]);
const [filesToRemove, setFilesToRemove] = useState([]);
```

Three arrays for images, because there are genuinely three categories. Newly chosen files not yet sent, existing images already on the server, and existing images the user has marked for deletion.

```jsx
useEffect(() => {
    if (!productData) return;
    const previousImages = (productData.images || []).map(item => `${IMG_URL}${item}`)
    setData({
        ...defaultForm,
        ...productData,
```

Populates the form when editing. The early return handles Add, which passes nothing.

Spreading `defaultForm` first guarantees every field exists, so nothing switches from uncontrolled to controlled as data arrives. React warns loudly about that, and it happens whenever a value starts as `undefined`.

The stored filenames are turned into full URLs by prefixing `IMG_URL`.

```jsx
        discountedItem: productData.discount && productData.discount.discountedItem
            ? productData.discount.discountedItem
            : false,
```

The nested discount object is flattened into individual form fields, mirroring the reassembly that happens server side in the query layer.

```jsx
        manuDate: productData.manuDate ? formatDate(productData.manuDate, 'YYYY-MM-DD') : '',
```

Dates arrive as ISO strings with a time component, and an HTML date input accepts only `YYYY-MM-DD`. Without this conversion the input renders empty and silently loses the value.

```jsx
const handleChange = e => {
    let { name, value, type, checked, files } = e.target;

    if (type === 'file') {
        // The file input has no `name`, so it must NOT fall through to the
        // setData below — that would add an empty-string key to `data`, which
        // becomes a nameless multipart field and makes multer reject the upload.
        if (files[0]) setFilesToUpload(prev => [...prev, files[0]])
        return;
    }
```

The comment documents a real bug that was presumably painful to find. The file input has no `name`, so allowing it to reach `setData` would write a key of `''` into the form object, which becomes a nameless field in the `FormData`, which Multer rejects with an error that does not point anywhere near the cause.

The early `return` is the fix.

```jsx
    if (type === 'checkbox') {
        value = checked
    }
    setData(prev => ({ ...prev, [name]: value }))
}
```

Checkboxes report through `checked`, everything else through `value`. Reassigning `value` lets both share the final line.

```jsx
const removeImage = (type, index, file) => {
    if (type === 'new') {
        setFilesToUpload(prev => prev.filter((_, i) => i !== index))
    }
    if (type === 'old') {
        setFilesToPreview(prev => prev.filter((_, i) => i !== index))
        setFilesToRemove(prev => [...prev, file])
    }
}
```

Removing a not yet uploaded file simply drops it. Removing an existing one takes it out of the preview and records it for the server, which is why both lists are updated.

```jsx
<img src={URL.createObjectURL(file)} alt="preview.png" width="200px"></img>
```

`URL.createObjectURL` makes a temporary in memory URL for a local file, so a newly chosen image previews immediately with no upload.

Strictly these URLs should be released with `URL.revokeObjectURL` when the component unmounts, since each one holds a reference to the file in memory. On a form with a handful of images this is not noticeable, but it is a genuine leak.

## components/Products/AddProduct/AddProduct.component.jsx

```jsx
const add = (data, files) => {
    setIsSubmitting(true)
    httpClient.UPLOAD('POST', '/product', data, files)
        .then(() => {
            notify.showSuccess('Product Added Successfully')
            navigate('/view_products')
        })
        .catch(err => {
            setIsSubmitting(false)
            ErrorHandler(err)
        })
}
```

A thin wrapper supplying the create behaviour to the shared form. The whole component is about twenty lines, because the form does the work.

`UPLOAD` rather than `POST`, since this carries files.

## components/Products/EditProduct/EditProduct.component.jsx

```jsx
useEffect(() => {
    let cancelled = false;
    setIsLoading(true)
    httpClient.GET(`/product/${productId}`, true)
        .then(response => {
            if (!cancelled) setProduct(response.data)
        })
        .catch(err => ErrorHandler(err))
        .finally(() => {
            if (!cancelled) setIsLoading(false)
        })
    return () => { cancelled = true }
}, [productId])
```

The `cancelled` flag is the pattern to learn from this file.

If the user navigates away before the request finishes, the component unmounts but the promise still resolves and tries to set state on something that no longer exists. React warns about this, and in more complex cases it causes real bugs.

The cleanup function returned from the effect sets the flag, and both callbacks check it before touching state. The request itself is not aborted, but its result is ignored.

`[productId]` as the dependency means the effect reruns if the id changes while the component stays mounted.

```jsx
const { images, reviews, _id, __v, createdAt, updatedAt, discount, vendor, ...editable } = data;
const requestData = {
    ...editable,
    vendor: vendor && vendor._id ? vendor._id : vendor,
    filesToRemove
}
```

Destructuring used as a filter. The named fields are pulled out and discarded and `...editable` collects the rest.

The comment above it explains why: server managed fields must not be resent, and `images` in particular collides with the multipart field of the same name and corrupts the stored list.

The `vendor` line handles a shape difference. Reading a product populates the vendor into a full user object, but writing needs just the id, so this unwraps it if it was populated and passes it through otherwise.

## components/Products/ViewProducts/ViewProducts.component.jsx

```jsx
const NO_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">...</svg>'
);
```

A placeholder image built as an inline data URL rather than loaded from a file.

Because it is part of the JavaScript bundle, it cannot itself fail to load, which matters for something whose only job is to appear when another image failed. A placeholder fetched over the network could fail for the same reason the original did.

```jsx
export const ViewProducts = ({ productData, resetSearch }) => {
```

This component does double duty. With no props it shows the Redux backed list. With `productData` it renders search results passed in by the search screen.

```jsx
useEffect(() => {
    if (!productData) {
        dispatch(fetchProducts_ac(1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

The fetch is skipped when displaying search results, since the data was already provided.

The lint suppression is worth understanding rather than copying blindly. The rule wants `productData` and `dispatch` in the dependency array, but including them would refetch whenever the reference changed. The intent is to run once on mount, and the comment marks it as deliberate.

```jsx
const displayedProducts = productData || products;
```

One line that makes the dual mode work. Everything below renders `displayedProducts` without caring which source it came from.

```jsx
<img
    src={item.images && item.images[0] ? `${IMG_URL}${item.images[0]}` : NO_IMAGE}
    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = NO_IMAGE; }}
></img>
```

Two layers of protection. The ternary covers a product with no images. `onError` covers an image that exists in the database but not on disk, which is exactly what happens after a restart wipes the uploads folder.

`e.currentTarget.onerror = null` before changing the source is essential. Without it, a failure loading the placeholder would fire `onError` again and loop forever.

```jsx
const removeProduct = (id) => {
    const confirmation = window.confirm("Are you sure to remove?");
    if (confirmation) {
        dispatch(removeProduct_ac(id))
    }
}
```

`window.confirm` blocks the browser and looks like the operating system rather than the app, so a custom modal would be better. It is, however, three lines and impossible to get wrong.

## components/Products/SearchProduct/SearchProduct.component.jsx

```jsx
useEffect(() => {
    setIsCategoryLoading(true)
    httpClient.POST('/product/search', {})
        .then(response => {
            const cats = [];
            (response.data || []).forEach(item => {
                if (cats.indexOf(item.category) === -1) {
                    cats.push(item.category)
                }
            })
            setCategories(cats)
            setAllProducts(response.data)
        })
```

An empty search returns every product, which is then used to populate the dropdowns.

The loop collects distinct categories by checking membership before pushing. A `Set` would express this more directly, as `[...new Set(products.map(p => p.category))]`, but the result is the same.

Fetching every product to build a dropdown does not scale. A dedicated endpoint returning only the distinct categories would be the right fix as the catalogue grows.

```jsx
const populateNames = (selectedCategory) => {
    setNames(allProducts.filter(item => item.category === selectedCategory))
}
```

Dependent dropdowns. Choosing a category filters the cached list to produce the name options, with no extra request, which is the payoff for having fetched everything up front.

```jsx
const payload = { ...data };
if (!payload.multipleDateRange) {
    payload.toDate = payload.fromDate
}
```

When the range checkbox is off, the single chosen date becomes both ends of the range, so the server's `$gte` and `$lte` still describe one day.

```jsx
if (searchResults.length > 0) {
    return <ViewProducts productData={searchResults} resetSearch={reset}></ViewProducts>
}
```

Rather than rendering its own results table, the component returns the existing one with the results passed in. One table component, two screens, no duplication.

## components/Products/ProductDetailsLanding/ProductDetailsLanding.component.jsx

```jsx
export const ProductDetailsLanding = () => {
    const { id: productId } = useParams();
    const dispatch = useDispatch();
    const isProductLoading = useSelector(state => state.product.isProductLoading);
    const product = useSelector(state => state.product.product);
```

A container component. It fetches data and passes it down, leaving the presentation to its two children.

Each `useSelector` subscribes to one slice of state, so the component only rerenders when that specific value changes. Selecting the whole state object instead would rerender on every unrelated change.

```jsx
const submitReview = reviewData => {
    dispatch(addReview_ac({ reviewData, productId }))
}
```

`AddReview` does not know about Redux at all. It calls a function it was given, which keeps it reusable and easy to test.

## components/Products/ProductDetailsLanding/Details/Details.component.jsx

```jsx
const getImages = (images = []) => {
    return images.map(img => ({
        original: `${IMG_URL}${img}`,
        thumbnail: 'https://picsum.photos/id/1018/250/150/',
    }))
}
```

Adapts the stored filenames into the shape `react-image-gallery` expects.

The thumbnail is a hardcoded placeholder from a random image service, so every thumbnail shows the same unrelated photo. It is an obvious loose end, and the fix is simply to use the same URL as `original`.

```jsx
{(product.reviews || []).map((review, index) => (
    <div key={index} className="review-card">
        <p>{review.point}</p>
        <p>{review.message}</p>
        <p>{review.user.email}</p>
```

`review.user.email` works because the server populated the reference, replacing the stored id with a document.

There is no guard on `review.user`, so a review whose author was deleted would crash this render. Optional chaining would make it safe.

Using the array index as a `key` is acceptable for a list that only ever grows at the end, which reviews do. For a list that can be reordered or filtered, a stable id is required.

## components/Products/ProductDetailsLanding/AddReview/AddReview.component.jsx

```jsx
const handleSubmit = e => {
    e.preventDefault();
    addReview(data);
    setData({ ...defaultForm })
}
```

Clears the form immediately rather than waiting for the request to finish, which feels responsive but means the text is lost if the submission fails. Clearing inside a `.then` would be safer.

```jsx
<input className="form-control" value={data.reviewPoint} type="number" min="1" max="5" name="reviewPoint" onChange={handleChange}></input>
```

`min` and `max` mirror the schema's constraints on the rating. The browser enforces them for the spinner controls, though a typed value still needs the server check, which the schema provides.

## components/Users/Chat/Chat.component.jsx

```jsx
const socketRef = useRef(null);
```

The socket is kept in a ref rather than state. A ref persists across renders but changing it does not trigger one, which is exactly right for a connection object that the UI never displays.

```jsx
useEffect(() => {
    const socket = io(SOCKET_URL, {
        auth: { token: localStorage.getItem('token') }
    })
    socketRef.current = socket;
```

The token goes in the handshake `auth` object, which is what the server's `io.use` middleware reads. Authentication happens once as the connection opens rather than per message.

```jsx
    socket.on('reply-message-own', (data) => {
        setMessages(prev => [...prev, { ...data, mine: true }])
    })
    socket.on('reply-message', (data) => {
        setMsgBody(prev => ({ ...prev, receiverId: data.senderId }))
        setMessages(prev => [...prev, { ...data, mine: false }])
    })
```

Two events for the two directions, with the server deciding which to send. The client tags each with `mine`, which drives the left or right alignment.

The incoming handler also sets `receiverId` to the sender, so replying to a message that arrives while you are idle addresses the right person without having to select them.

```jsx
    return () => {
        socket.disconnect();
    }
}, [])
```

The most important four lines in the file. Without this cleanup, navigating away leaves the socket connected and returning opens a second one. After a few round trips every message arrives several times over, which is a confusing bug to diagnose.

```jsx
const handleSubmit = e => {
    e.preventDefault();
    if (!msgBody.receiverId) {
        return notify.showInfo('please select a user to continue')
    }
    socketRef.current.emit('new-message', msgBody)
    setMsgBody(prev => ({ ...prev, message: '' }))
}
```

`emit` sends an event over the open socket, which is a different mechanism from an HTTP request: no response is awaited, and the reply arrives later as its own event.

Only the message text is cleared, so the selected recipient persists for a conversation.

The message is not added to the list here. It appears when the server echoes it back through `reply-message-own`, which means what you see is what the server actually recorded rather than an optimistic guess.

## components/Users/Notifications/Notifications.component.jsx

```jsx
const load = useCallback((targetPage) => {
    setIsLoading(true);
    httpClient.GET('/notification', true, { page: targetPage, limit: 10 })
```

`useCallback` returns the same function instance between renders as long as its dependencies do not change. That matters here because `load` is used as an effect dependency, and a new function each render would restart the effect in a loop.

```jsx
useEffect(() => {
    load(1);
}, [load])
```

With `load` stabilised by `useCallback` and an empty dependency list, this runs once on mount. It also satisfies the lint rule honestly, without a suppression comment.

```jsx
const markRead = (id) => {
    httpClient.PUT(`/notification/${id}/read`, {}, true)
        .then(() => {
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
        })
```

Local state is updated after the server confirms, rather than refetching the page. The `map` replaces the one changed item and leaves the rest untouched, creating a new array so React detects the change.

Note that the sidebar badge does not update, since it fetched its count once when it mounted.

## components/Admin/Admin.component.jsx

```jsx
const roleLabel = {
    [ROLES.ADMIN]: 'Admin',
    [ROLES.USER]: 'User',
    [ROLES.VISITOR]: 'Visitor'
}
```

Computed keys turn the role constants into a lookup for display names, so the numbers never appear in the interface.

```jsx
const changeRole = (user, role) => {
    httpClient.PUT(`/user/${user._id}`, { role: Number(role) }, true)
```

`Number(role)` is essential. A `<select>` value is always a string, and the server compares roles with strict equality, so sending `"1"` would store a string that never matches `ROLES.ADMIN`. This single conversion is why promoting through the admin panel cannot produce the broken state that editing the database by hand can.

```jsx
// `status` (not `isArchived`) is what auth.controller.js actually
// checks to block login — this is the toggle that does something.
const toggleStatus = (user) => {
    const status = user.status === 'inactive' ? 'active' : 'inactive';
```

The comment records the reasoning behind choosing between two similar looking fields, which is exactly the kind of thing that is obvious while writing and mysterious six months later.

```jsx
<select
    value={user.role}
    disabled={user._id === currentUser?._id}
    onChange={(e) => changeRole(user, e.target.value)}
>
```

Admins cannot change their own role, and the same guard disables the deactivate button. That prevents the last administrator locking themselves out, which would require database access to undo.

## components/Settings/Settings.component.jsx

```jsx
temporaryAddress: (user.address?.temporaryAddress || []).join(','),
```

The stored array is joined into a comma separated string for a single text input, and the server splits it back. Optional chaining handles a user with no address.

```jsx
const handleSubmit = e => {
    e.preventDefault();
    if (data.password && data.password !== data.confirmPassword) {
        return notify.showError('Passwords do not match')
    }
```

The password check runs only when a password was typed, since the field is left blank to keep the existing one.

```jsx
    const payload = { ...data };
    if (!payload.password) {
        delete payload.password;
    }
    delete payload.confirmPassword;
```

An empty password is removed entirely rather than sent as an empty string. The server hashes whatever it receives, so sending `''` would replace the password with a hash of nothing and lock the user out.

`confirmPassword` is always removed, since it is a client side concept the API has no field for.

```jsx
    httpClient.PUT(`/user/${currentUser._id}`, payload, true)
        .then(response => {
            notify.showSuccess('Settings updated');
            localStorage.setItem('user', JSON.stringify(response.data));
```

The stored user is refreshed from the server's response, so the header shows an updated username immediately rather than the stale one.

## components/Contact/Contact.component.jsx

The simplest form in the project, and a good one to read first. Two fields, one handler, one submit. It carries no client side validation at all, relying entirely on the server's `notEmpty` rules and the message they return.

## components/About/About.component.jsx

Static text, no state, no props. Included for completeness.

## styles/_variables.scss

```scss
$primary: #4f46e5;
$secondary: #64748b;
$body-bg: #f8fafc;
$body-color: #0f172a;
$border-color: #e2e8f0;
```

Bootstrap variable overrides, and the leading underscore marks it as a Sass partial, meaning it compiles only when imported elsewhere.

Bootstrap defines these with `!default`, meaning "use this unless already set". Assigning them before importing Bootstrap is therefore what recolours the entire framework: every button, link, border and focus ring derives from these values. Overriding the compiled CSS afterwards would take far more code and would miss the derived shades Bootstrap computes.

## styles/theme.scss

```scss
@import './variables';
@import 'bootstrap/scss/bootstrap';
```

Order is the whole point. Variables first so the overrides are in place, then Bootstrap, which compiles using them.

```scss
:root {
    --accent: #{$primary};
    --accent-hover: #{$link-hover-color};
    --surface: #ffffff;
```

Bridges Sass variables into CSS custom properties. Sass variables vanish at compile time, so the plain CSS component files cannot see them. Custom properties exist at runtime, so `var(--accent)` works from any stylesheet.

`#{...}` is Sass interpolation, inserting the variable's value into the output.

```scss
    // Chat messenger bubble colors (previously referenced but never defined)
    --msger-bg: #f8fafc;
```

The comment records a fix for variables the chat stylesheet referenced without anything defining them, which would have rendered as transparent.

## Component CSS files

Each component folder carries its own plain CSS file, imported directly by its component. Vite bundles them, and the naming convention keeps each file next to the component it styles.

They use the custom properties defined in `theme.scss` rather than repeating colour values, so changing the accent colour in `_variables.scss` updates everything at once.

`Chat.component.css` is the largest, implementing the messenger layout with the bubble alignment that `mine` selects between. `Details.component.css` sets a scrollable review panel. The rest are small layout adjustments over Bootstrap.
