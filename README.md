# Marketly

Marketly is a vendor marketplace built on the MERN stack. Vendors register an account, list products with images, manage their own inventory, and receive reviews from other users. It also carries real time one to one chat, an in app notification feed, password reset over email, and an admin panel for managing accounts.

This README explains how the whole thing works, why it is built the way it is, and how it is deployed. It assumes you know JavaScript and have seen React before, but it does not assume you have built a full stack app. Every concept that matters is explained where it first comes up.

If you want an exhaustive file by file, line by line commentary instead, read [CODE_WALKTHROUGH.md](CODE_WALKTHROUGH.md). This document covers the ideas. That one covers every line.

## Live demo

| Piece | URL |
|---|---|
| Web app | `https://YOUR-PROJECT.vercel.app` |
| API | `https://YOUR-SERVICE.onrender.com` |

The API sleeps when nobody is using it, so the very first page load after a quiet period can take up to a minute. Give it a moment and refresh. The [Known limitations](#known-limitations) section explains why.

## Contents

1. [What the app does](#what-the-app-does)
2. [The tech stack and why](#the-tech-stack-and-why)
3. [How the three pieces fit together](#how-the-three-pieces-fit-together)
4. [Project structure](#project-structure)
5. [Running it locally](#running-it-locally)
6. [Environment variables](#environment-variables)
7. [Core flow: registration and login](#core-flow-registration-and-login)
8. [Core flow: how a protected request is authorised](#core-flow-how-a-protected-request-is-authorised)
9. [Core flow: roles and ownership](#core-flow-roles-and-ownership)
10. [Core flow: creating a product with images](#core-flow-creating-a-product-with-images)
11. [Core flow: search](#core-flow-search)
12. [Core flow: reviews and notifications](#core-flow-reviews-and-notifications)
13. [Core flow: real time chat](#core-flow-real-time-chat)
14. [Core flow: password reset](#core-flow-password-reset)
15. [How errors travel from database to toast](#how-errors-travel-from-database-to-toast)
16. [State management with Redux Toolkit](#state-management-with-redux-toolkit)
17. [API reference](#api-reference)
18. [Deployment](#deployment)
19. [Known limitations](#known-limitations)
20. [Making the first admin](#making-the-first-admin)

## What the app does

A visitor lands on the login page. They register, which creates an account with the default role of ordinary user, then log in and receive a token that the browser keeps.

Once inside, they can add products with photos, browse and edit the products they own, search across every product in the system using a multi field form, open any product to read its reviews and leave one of their own, chat live with anyone else who is currently online, read notifications that arrive when somebody reviews one of their products, update their own profile, and send a message through the contact form.

An administrator sees everything the ordinary user sees plus an admin panel, where they can change anybody's role and deactivate or reactivate accounts. Deactivating an account blocks that person from logging in.

## The tech stack and why

The backend lives in [api/](api/) and runs on Node with Express. Data is stored in MongoDB and accessed through Mongoose, which gives the otherwise schemaless database a schema and a validation layer. Authentication uses JSON Web Tokens signed with `jsonwebtoken`, and passwords are hashed with `bcryptjs`. File uploads are handled by Multer, real time chat by Socket.IO, and outbound email by Nodemailer. Helmet sets security headers, `express-validator` validates incoming request bodies, and `express-rate-limit` throttles the login endpoint.

The frontend lives in [web/](web/) and is a React 18 single page app built by Vite. Routing is React Router 6, server state for products flows through Redux Toolkit, HTTP calls go out through Axios, and styling is Bootstrap 5 customised through Sass. Socket.IO has a matching client library, and `react-toastify` shows the little notification popups.

Each choice earns its place. Mongoose matters because MongoDB will happily store a document with a misspelled field name, and the schema is what stops that. JWT matters because it lets the API stay stateless, meaning no session store to run and no sticky sessions to worry about when hosting. Redux Toolkit is used only for products, which is the one piece of state that several unrelated screens need to read and write. Everything else is local component state, which is the right call. Reaching for a global store when `useState` would do is a common way to make a small app hard to follow.

## How the three pieces fit together

Three separate services run in production, and understanding why they are separate is the key to understanding the deployment.

The **web app** is compiled by Vite into plain HTML, CSS and JavaScript. Those files are identical for every visitor, so they can be served straight off a CDN by Vercel. Vercel never touches the database and does not know it exists.

The **API** is a Node process that must stay running. It holds the database credentials, verifies tokens, writes uploaded files, and keeps WebSocket connections open for minutes at a time. That rules out serverless hosting and puts it on Render.

The **database** is MongoDB Atlas, which the API connects to over the network at startup.

The content you see on screen is assembled in your browser, not on a server. The browser downloads an almost empty HTML shell, React boots, React calls the API, the API queries MongoDB, JSON comes back, and React renders it. That is called client side rendering, and it is why the frontend can be a pile of static files while the app itself is fully dynamic.

## Project structure

```
api/
  app.js                    Express setup, middleware order, server start
  db_init.js                MongoDB connection
  configs/                  Reads and validates environment variables
  constants/roles.js        ADMIN = 1, USER = 2, VISITOR = 3
  routes/api.route.js       Mounts every route group under /api
  controllers/              Auth, users, notifications, contact
  components/products/      Product model, routes, controller, queries
  models/                   Mongoose schemas for user and notification
  middlewares/              Auth, roles, ownership, uploads, errors
  validators/               Request body rules, per feature
  helpers/                  Safe field mapping from request to document
  utils/                    Error class, async wrapper, mailer
  sockets/chat.socket.js    Socket.IO chat server
  uploads/images/           Uploaded files land here

web/
  index.html                The shell that React mounts into
  vite.config.js            Build and dev server config
  vercel.json               SPA rewrite so refreshes do not 404
  src/
    index.jsx               Entry point
    store.js                Redux store
    components/             One folder per screen or reusable piece
    slices/productSlice.js  Redux state and async actions for products
    utils/                  HTTP client, error handler, toasts, dates
    services/redirection.js Role based redirect after login
    constants/roles.js      Mirror of the API role numbers
    styles/                 Bootstrap overrides and app theme
```

Two things about this layout are worth calling out because they look inconsistent at first glance.

Products live under `components/products/` while users and notifications live under `controllers/` and `models/`. The products folder groups its model, routes, controller and queries together by feature, which is a pattern that scales better as a codebase grows. The rest of the API is organised by technical layer instead. Both are valid approaches. This project happens to contain one example of each.

The products feature also has an extra layer the others do not. [product.query.js](api/components/products/product.query.js) sits between the controller and the model, so the controller never talks to Mongoose directly. That keeps HTTP concerns and database concerns apart.

## Running it locally

You need Node 20.19 or newer, since Vite 8 requires it, and a MongoDB instance. A local install works, so does Docker, so does a free Atlas cluster.

Start the backend first.

```bash
cd api
npm install
cp .env.example .env
```

Open `.env` and set `JWT_SECRET` to any long random string. The server refuses to start without it, on purpose, because a missing signing key is the kind of mistake that should fail loudly rather than quietly default to something insecure. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Then start it.

```bash
npm run dev
```

The API listens on port 4040. Watch for `db connection successful` in the output. If that line is missing, `MONGO_URI` is wrong and nothing else will work.

Now the frontend, in a second terminal.

```bash
cd web
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000` and register an account.

Email will not send until you fill in the `SMTP_*` values. Until then the mailer logs what it would have sent to the API console, so password reset and the contact form still work end to end. You just read the reset link out of the terminal instead of an inbox. This is deliberate, and [mailer.js](api/utils/mailer.js) explains why.

## Environment variables

The API reads its configuration through [configs/index.js](api/configs/index.js), which is the only backend file that touches `process.env`. Every other file imports from it. Centralising this means defaults live in one place and a missing variable is caught at startup rather than halfway through a request.

| Variable | Required | What it does |
|---|---|---|
| `JWT_SECRET` | Yes | Signs and verifies tokens. The server throws on boot if it is missing |
| `MONGO_URI` | Yes in production | Connection string. Defaults to a local database |
| `PORT` | No | Defaults to 4040. Hosts inject their own |
| `JWT_EXPIRES_IN` | No | Token lifetime, defaults to `7d` |
| `CORS_ORIGIN` | Yes in production | Which origins may call the API. Accepts a comma separated list |
| `FRONTEND_URL` | Yes in production | Used to build password reset links in emails |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | No | Outbound email. Without these, mail is logged instead of sent |
| `CONTACT_EMAIL` | No | Where the contact form delivers. Falls back to `SMTP_FROM` |

The frontend needs three, all of which must begin with `VITE_`. Vite deliberately refuses to expose any other variable to browser code, which prevents a server secret from being bundled into public JavaScript by accident.

| Variable | Example |
|---|---|
| `VITE_BASE_URL` | `http://localhost:4040/api` |
| `VITE_IMG_URL` | `http://localhost:4040/file/images/` |
| `VITE_SOCKET_URL` | `http://localhost:4040` |

Mind the trailing slashes. These strings are concatenated directly onto paths, so `VITE_IMG_URL` needs its trailing slash and the other two must not have one.

One important difference between the two sets. The API reads its variables at runtime, so changing one and restarting is enough. Vite bakes the `VITE_` values into the JavaScript bundle when it builds, so changing one means rebuilding. Editing them on a deployed frontend does nothing until you redeploy.

## Core flow: registration and login

This is the flow to understand first, because almost everything else depends on the token it produces.

### Registering

[Register.component.jsx](web/src/components/Auth/Register/Register.component.jsx) collects the form, checks that the required fields are filled and that the two passwords match, then posts the whole object to `/api/auth/register`.

Notice what the frontend does *not* check. It does not enforce the minimum username length or validate the email format. That is deliberate:

```js
// The fields the user must fill in. Email is intentionally NOT here.
const requiredFields = ['name', 'username', 'password', 'confirmPassword'];
```

Anything beyond "is this box empty" is left to the server, which returns a clear message the frontend simply displays. Duplicating validation rules in two places means they drift apart, and the client side copy can never be trusted anyway since anyone can call the API directly. The client checks what improves the typing experience. The server checks what actually matters.

On the server, [auth.controller.js](api/controllers/auth.controller.js) handles the request through a chain of four middlewares before the handler runs:

```js
router.post('/register', Uploader.single('image'), registerValidator, validate, catchAsync(async function (req, res, next) {
```

Read left to right, that is: parse any uploaded avatar, apply the validation rules, convert any validation failures into an error, then run the actual logic. Express middleware is just a queue of functions, each deciding whether to pass control onward, and this ordering is the whole design.

The handler itself does three things that matter:

```js
const newUser = new UserModel({});
const newMappedUser = MAP_USER_REQ(request_data, newUser)
newMappedUser.password = await bcrypt.hash(req.body.password, 10);
```

The request body is never handed to Mongoose directly. It goes through [map_user_req.js](api/helpers/map_user_req.js), which copies across one named field at a time. This is what stops a user from promoting themselves by posting `{"role": 1}` along with their registration, because `role` is not one of the fields that function copies. That class of bug is called mass assignment, and hand mapping is the simplest defence against it.

Then the password is hashed with bcrypt at cost factor 10. The plain text password is never stored. Bcrypt also salts each hash automatically, so two users with the same password still get different stored values.

### Logging in

The login handler finds the user, compares the password, and checks that the account is still active:

```js
const user = await UserModel.findOne({ username: req.body.username }).select('+password');
```

That `.select('+password')` is necessary because the schema marks the password field `select: false`, meaning Mongoose leaves it out of query results by default. Login is the one place that needs it, so it asks explicitly. Everywhere else in the app, a user document simply arrives without a password attached, which makes it very hard to leak one by accident.

```js
const isMatched = await bcrypt.compare(req.body.password, user.password);
```

`bcrypt.compare` re hashes the attempted password using the salt embedded in the stored hash and compares the results. There is no way to go the other direction and recover the original, so even a full database dump does not reveal anyone's password.

If that passes and the account is active, a token is signed:

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

A JWT is three base64 segments joined by dots: a header, a payload, and a signature. The payload here holds the user id, username and role. Critically, **the payload is encoded, not encrypted**. Anyone holding the token can read it. What they cannot do is change it, because altering a single character invalidates the signature, and producing a valid signature requires `JWT_SECRET`.

This design has one consequence that trips people up constantly. Because the role is copied into the token at login, **promoting somebody to admin does not affect their current session**. Their existing token still says role 2. They must log out and log back in to receive a token that says otherwise.

The browser stores the result:

```js
localStorage.setItem('token', response.data.token);
localStorage.setItem('user', JSON.stringify(response.data.user))
```

`localStorage` survives refreshes and browser restarts, which is what keeps you logged in. It is readable by any JavaScript running on the page, which means a cross site scripting vulnerability would expose the token. The more hardened alternative is an httpOnly cookie, which JavaScript cannot read at all. This project uses localStorage for simplicity, and that is a reasonable tradeoff to understand rather than a mistake to hide.

## Core flow: how a protected request is authorised

Every protected route passes through [authentication.js](api/middlewares/authentication.js). It runs before the route handler and its job is to turn a token back into a user.

```js
let token;
if (req.headers['authorization']) token = req.headers['authorization']
if (req.headers['x-access-token']) token = req.headers['x-access-token']
if (req.query['token']) token = req.query['token']
```

Three accepted locations. The header is the normal path. The query string exists because file uploads go out through raw `XMLHttpRequest` rather than Axios, and setting custom headers there is awkward, so the token rides in the URL instead. That is a pragmatic compromise worth knowing about, since URLs turn up in server logs far more often than headers do.

```js
token = token.split(' ')[1] || token;
```

The header arrives as `Bearer eyJhbGci...`, so this strips the prefix. The `|| token` fallback handles a bare token with no prefix.

```js
decoded = jwt.verify(token, configs.JWT_SECRET, { algorithms: ['HS256'] });
```

`jwt.verify` recomputes the signature and throws if it does not match or if the token has expired. Pinning `algorithms` matters more than it looks: without it, a library will accept whatever algorithm the token's own header claims, and an attacker can claim `none`. Naming the algorithm explicitly closes that hole.

```js
const user = await UserModel.findById(decoded._id);
if (!user) {
    return next(new AppError(404, 'User removed from system'));
}
req.user = user;
```

Even though the token already carries the user data, the middleware fetches the live record. That extra query is what makes a deleted account stop working immediately instead of lingering until the token expires. From this point on, every handler downstream can rely on `req.user` being a real, current user.

Where this runs is decided in [api.route.js](api/routes/api.route.js):

```js
router.use('/auth', authRoute);
router.use('/user', authenticate, userRoute);
router.use('/product', productRoute);
router.use('/notification', authenticate, notificationRoute);
router.use('/contact', authenticate, contactRoute);
```

`/auth` is open, because you cannot present a token before you have one. `/user`, `/notification` and `/contact` are gated here at the mount point. `/product` is not, because its routes have mixed requirements and apply `authenticate` individually.

## Core flow: roles and ownership

There are two distinct questions to answer once you know who someone is. What rank are they, and does this particular object belong to them? The codebase keeps these separate.

Rank is handled by [authorization.js](api/middlewares/authorization.js):

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

This is a function that returns a middleware, a pattern worth recognising because it shows up everywhere in Express. `restrictTo(ROLES.ADMIN)` is called once when the route is defined, and the function it returns is what runs on each request, with `allowedRoles` captured in a closure.

Note that `includes` compares strictly. Role `1` and role `"1"` are different values, so a role stored as a string in the database silently never matches. That is the single most likely cause of an admin account that appears correct but has no access.

Ownership is handled by [ownership.js](api/middlewares/ownership.js):

```js
const isSelfOrAdmin = catchAsync(async function (req, res, next) {
    if (req.user.role === ROLES.ADMIN || String(req.user._id) === req.params.id) {
        return next();
    }
    next(new AppError(403, 'You can only access your own account'));
})
```

The `String()` wrapper is doing real work. `req.user._id` is a Mongoose ObjectId object while `req.params.id` is a string from the URL, and comparing them without conversion is always false. This is one of the most common bugs in Mongoose code.

Its sibling `isVendorOrAdmin` loads the product before deciding, then stashes it on the request so the handler does not have to fetch it a second time:

```js
if (req.user.role === ROLES.ADMIN || (product.vendor && String(product.vendor) === String(req.user._id))) {
    req.product = product;
    return next();
}
```

Together these produce sentences that read naturally in the route definitions:

```js
.put(authenticate, isVendorOrAdmin, Uploader.array('images'), updateValidator, validate, productCtrl.update)
```

Know who you are, prove this product is yours, accept the files, check the fields, then do the work.

There is a third layer, and it is the subtle one. Being allowed to call an endpoint is not the same as being allowed to change every field on it. The user update handler enforces that distinction explicitly:

```js
// role / isArchived / status are privileged fields — only an admin
// may change them (status in particular gates login)
if (req.user.role === ROLES.ADMIN) {
    if (request_data.role !== undefined) user.role = request_data.role;
    if (request_data.isArchived !== undefined) user.isArchived = request_data.isArchived;
    if (request_data.status !== undefined) user.status = request_data.status;
}
```

`isSelfOrAdmin` lets you edit your own profile. This block is what stops you from slipping `role: 1` into that same request. The three privileged fields are also deliberately absent from `map_user_req`, so there is no second path to them. Two independent barriers guarding the same thing is not redundancy, it is defence in depth.

## Core flow: creating a product with images

This flow is worth tracing carefully because it is the only one that does not use JSON.

A normal request sends `Content-Type: application/json` and a JSON body. Files cannot travel that way, so the browser uses `multipart/form-data`, which splits the body into labelled parts with binary chunks between them. Axios is not used here at all. [httpClient.js](web/src/utils/httpClient.js) drops to raw `XMLHttpRequest`:

```js
const UPLOAD = (method, url, data = {}, files = []) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        files.forEach(item => {
            if (item) formData.append('images', item, item.name)
        })

        for (let key in data) {
            if (key) formData.append(key, data[key])   // never send a nameless field
        }
```

Every file is appended under the same field name, `images`, which is what lets Multer collect them into an array. The `if (key)` guard prevents a nameless field, which Multer rejects outright with a confusing error.

The function then reshapes its own rejection to match what Axios would have produced:

```js
// Reject with the SAME shape axios uses ({ response: { status, data } }),
// so ErrorHandler can read error.response.data.msg and show the real
// server message instead of a generic one.
```

This small piece of adapter code is why the error handling described later works uniformly. One less special case for every caller.

On the server, [uploader.js](api/middlewares/uploader.js) configures Multer:

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

The timestamp prefix prevents two users uploading `photo.jpg` from overwriting each other. There is a size cap of 5MB and a filter that rejects anything whose MIME type is not an image. Note how the filter refuses a file:

```js
req.fileTypeError = true;
cb(null, false)
```

It flags the request and returns `false` rather than raising an error. Throwing from inside Multer produces an unhelpful message, so instead the handler checks the flag afterwards and returns a clean one. It is a small thing that makes a real difference to the message the user sees.

Multer saves the files and puts a description of each on `req.files`. The controller turns those into filenames:

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

Only the filename is stored in MongoDB, never the file itself. The bytes stay on disk and the database holds a pointer. That last line is the important one: the vendor is taken from the authenticated user, never from the request body, so a product cannot be created in somebody else's name.

Serving those files back out needs one special accommodation, in [app.js](api/app.js):

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

Helmet sets `Cross-Origin-Resource-Policy: same-origin` across the app, which is a sensible default. But the images are requested by a page on a different origin, so the browser blocks them even though the server sends them happily. This relaxes the header for the static file route only, which is the narrowest fix that works.

Editing an existing product adds one more wrinkle, handled in [EditProduct.component.jsx](web/src/components/Products/EditProduct/EditProduct.component.jsx):

```js
// Only send editable fields. Server-managed fields must NOT be resent —
// in particular `images` collides with the file-upload field name and
// corrupts the stored image list.
const { images, reviews, _id, __v, createdAt, updatedAt, discount, vendor, ...editable } = data;
```

Destructuring is used here as a filter. The named fields are pulled out and discarded, and `...editable` collects everything else. Sending `images` back would clash with the multipart field of the same name, which is exactly the kind of bug that takes an afternoon to find.

## Core flow: search

Search shows how to build a MongoDB query from a form where every field is optional. [product.controller.js](api/components/products/product.controller.js) builds the filter one condition at a time:

```js
const params = { ...req.query, ...req.body };
const condition = {};

if (params.category) {
    condition.category = params.category;
}
if (params.name) {
    condition.name = new RegExp(params.name, "i");
}
```

The object starts empty and grows only for fields the user actually filled in. An empty object matches everything, which is exactly the behaviour you want from an empty search form. The route accepts both GET and POST, which is why the two sources are merged on the first line.

Exact fields use plain equality. Text fields use a case insensitive regular expression, so searching for "phone" finds "Smartphone". Colour and brand anchor the pattern with `^` and `$` to require a full match, since a partial brand match would be noise rather than help.

Ranges need a nested object:

```js
if (params.minPrice || params.maxPrice) {
    condition.price = {};
    if (params.minPrice) condition.price.$gte = Number(params.minPrice);
    if (params.maxPrice) condition.price.$lte = Number(params.maxPrice);
}
```

`$gte` and `$lte` are MongoDB's greater than or equal and less than or equal operators. Building the sub object first means a minimum without a maximum works, and so does the reverse.

Two things about this endpoint are worth flagging honestly. It is the only product route with no `authenticate` in front of it, so product data is readable without logging in. And it returns every match at once with no pagination, while the rest of the app paginates. Both are fine at demo scale and both would need attention before real traffic.

## Core flow: reviews and notifications

Reviews are stored inside the product document rather than in their own collection:

```js
const ProductSchema = new Schema({
    // ...
    reviews: [reviewSchema],
```

This is called embedding, and it is a genuine design decision rather than an accident. Reviews are always read together with their product, never on their own, so keeping them in the same document means one query instead of two. The tradeoff is that a product with thousands of reviews becomes an unwieldy document. For a marketplace of this size, embedding is the right call.

Adding one appends to the array and saves:

```js
product.reviews.push(newReview);
return product.save();
```

The interesting part is what happens next, in the controller:

```js
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
```

Look at the ordering. The response is sent *before* the notification is created, and the notification promise is deliberately not awaited. If creating it fails, the error is logged and the user still sees their review succeed, because it did succeed. Letting a secondary side effect fail a primary action is a common design error, and this avoids it.

The guard on the first line stops you being notified about your own review.

## Core flow: real time chat

Ordinary HTTP cannot push. The client asks, the server answers, the connection closes. Chat needs the server to speak first, which means a WebSocket: a connection that stays open so either side can send at any time. Socket.IO wraps that with reconnection and fallbacks.

The chat server shares a port with the REST API, which is why [app.js](api/app.js) creates an HTTP server explicitly instead of calling `app.listen`:

```js
const server = http.createServer(app);
// ...
const io = new Server(server, {
  cors: { origin: corsOrigins },
});
```

Express and Socket.IO both attach to the same underlying server object. One port, two protocols.

Authentication happens once, when the socket connects, in [chat.socket.js](api/sockets/chat.socket.js):

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
```

`io.use` is the socket equivalent of Express middleware, but it runs once per connection rather than once per message. The verified identity is attached to the socket itself, so every later message from that socket already knows who sent it.

Who is online is tracked in memory:

```js
// socket.id -> { id: userId, name: username } — identity always comes from
// the verified JWT on the handshake, never from client-emitted payloads.
const connectedUsers = new Map();
```

Keyed by socket id rather than user id, because one person can have several tabs open, and each tab is a separate socket that must receive its own copy of a message.

Delivery walks the map looking for the recipient:

```js
socket.on('new-message', function (payload) {
    const outgoing = {
        ...payload,
        senderId: socket.user._id,
        senderName: socket.user.username,
        time: Date.now()
    };

    for (const [socketId, user] of connectedUsers.entries()) {
        if (user.id === payload.receiverId) {
            io.to(socketId).emit('reply-message', outgoing);
        }
    }
    socket.emit('reply-message-own', outgoing);
});
```

The spread on the first line is followed immediately by three fields the server overwrites. That ordering is the security control: whatever the client claimed about who it is gets replaced with what the verified token says. Without it, anyone could send a message that appears to come from somebody else.

The loop continues after a match rather than breaking, so every tab that person has open receives the message. The sender gets their own copy back under a different event name, which is how the UI knows to render it on the right hand side.

On the client, [Chat.component.jsx](web/src/components/Users/Chat/Chat.component.jsx) opens the connection inside an effect:

```js
useEffect(() => {
    const socket = io(SOCKET_URL, {
        auth: { token: localStorage.getItem('token') }
    })
    socketRef.current = socket;
    // ... listeners ...
    return () => {
        socket.disconnect();
    }
}, [])
```

That returned cleanup function is essential. Without it, navigating away leaves the socket open, and coming back opens another. Do that a few times and messages arrive in duplicate. The socket is kept in a ref rather than state because changing it should not trigger a re render.

One honest limitation: messages are never stored. They live in React state and in the server's memory, so a refresh clears the conversation and an offline recipient never receives it. Making chat durable means writing each message to MongoDB, which this project does not do.

## Core flow: password reset

This flow is short but carries the densest security reasoning in the codebase.

```js
const user = await UserModel.findOne({ email: req.body.email });

// Always respond the same way whether or not the email is registered —
// don't let this endpoint be used to enumerate valid accounts.
const genericResponse = { msg: 'If that email is registered, a password reset link has been sent.' };

if (!user) {
    return res.json(genericResponse);
}
```

An unknown email produces exactly the same response as a known one. If it did not, anyone could feed a list of addresses through this endpoint and learn which have accounts. That is called account enumeration and it is a real, routinely exploited weakness.

```js
const rawToken = crypto.randomBytes(32).toString('hex');
user.passwordResetToken = hashToken(rawToken);
user.passwordResetExpires = Date.now() + RESET_TOKEN_TTL_MS;
```

The raw token goes in the email. Only its SHA-256 hash is stored. This is the same reasoning as password hashing: somebody who reads the database cannot use what they find there to reset anybody's password, because the value stored is not the value the endpoint accepts. Note that `crypto.randomBytes` is used rather than `Math.random`, because the latter is predictable and must never be used for anything security related.

Redeeming it hashes the incoming token and looks for a match that has not expired:

```js
const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
}).select('+passwordResetToken +passwordResetExpires');
```

Both conditions live in one query, so an expired token simply finds nothing, and the same "invalid or expired" message covers both cases. After a successful reset the fields are cleared, making the link single use.

## How errors travel from database to toast

Express has a rule that catches people out constantly: it handles synchronous throws automatically, but an async function that rejects will crash the process unless you catch it. The usual fix is a `try/catch` in every handler. This codebase uses a wrapper instead:

```js
module.exports = function catchAsync(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(next);
    }
}
```

Nine lines that remove a `try/catch` from every route in the app. The handler is called, and if its promise rejects, the error goes to `next`, which is what routes it to the error handler. Every controller in the project is wrapped in this.

Deliberate errors use a small custom class:

```js
class AppError extends Error {
    constructor(status, msg) {
        super(msg);
        this.status = status;
        this.msg = msg;
    }
}
```

Extending `Error` keeps stack traces intact while attaching an HTTP status, which is what lets the error handler tell an intentional 404 apart from an unexpected crash.

Everything converges on [errorHandler.js](api/middlewares/errorHandler.js). Express recognises a middleware with four arguments as an error handler, and it must be registered last:

```js
module.exports = function (err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.status).json({ msg: err.msg, status: err.status });
    }

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(function (e) { return e.message; });
        return res.status(400).json({ msg: messages.join(', '), status: 400 });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];
        const value = field ? err.keyValue[field] : '';
        return res.status(409).json({ msg: `${value} is already taken (${field})`, status: 409 });
    }
```

Each branch translates one kind of failure into a sentence a person can act on. Error 11000 is MongoDB's duplicate key code, which here becomes "that username is already taken". A malformed id becomes a note about which field was wrong. An expired token becomes "session expired, please log in again". Only genuinely unexpected errors fall through to a logged 500 and a generic message, which is the correct place to be vague, because internal details should not reach a client.

The payload shape never varies. Always `{ msg, status }`, always with `msg` as a plain string. That consistency is what makes the frontend handler simple:

```js
const serverMsg = error && error.response && error.response.data && error.response.data.msg;
if (serverMsg) {
    const text = typeof serverMsg === 'object' ? extractDbErrorMessage(serverMsg) : serverMsg;
    return notify.showError(text);
}
```

[error.handler.js](web/src/utils/error.handler.js) then degrades in three stages. If the server sent a message, show it. If the server responded without one, such as the rate limiter returning a bare 429, map the status code to something readable. If there was no response at all, distinguish a timeout from an unreachable server and say which:

```js
return notify.showError('Cannot reach the server. Please check that the API is running and try again.');
```

Compare that to the generic "Something went wrong" that most projects settle for. When the API is asleep or CORS is misconfigured, this message tells you where to look.

## State management with Redux Toolkit

Only products use Redux, because product data is the one thing several unrelated screens need. The list screen, the details screen and the search screen all read it, and a delete on one must be reflected on another.

Async work uses `createAsyncThunk`:

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

A thunk automatically dispatches three actions on your behalf: `pending` when it starts, `fulfilled` when it resolves, `rejected` when it throws. You never write those by hand. The reducer listens for them:

```js
.addCase(fetchProducts_ac.pending, (state) => {
    state.isLoading = true;
})
.addCase(fetchProducts_ac.fulfilled, (state, action) => {
    state.isLoading = false;
    state.products = action.payload.data;
    state.total = action.payload.total;
    state.page = action.payload.page;
    state.pages = action.payload.pages;
})
```

That `state.isLoading = true` looks like it breaks Redux's rule against mutating state. It does not. Redux Toolkit runs reducers inside Immer, which records the apparent mutations and produces a new immutable object from them. You write the simple version and get the correct behaviour.

Deleting avoids a refetch by filtering locally:

```js
.addCase(removeProduct_ac.fulfilled, (state, action) => {
    state.products = state.products.filter(item => item._id !== action.payload);
})
```

The thunk returns the deleted id, and the reducer drops it from the array. The row disappears immediately with no second round trip.

One detail shows real care. Submitting a review refetches the product so the new review appears, but passes a flag:

```js
dispatch(fetchProduct_ac({ id: productId, showLoader: false }))
```

which the reducer honours:

```js
.addCase(fetchProduct_ac.pending, (state, action) => {
    if (action.meta.arg.showLoader !== false) {
        state.isProductLoading = true;
    }
})
```

Without it, posting a review would blank the whole page and redraw it. With it, the review list updates in place. Same data fetch, completely different feel.

## API reference

Every path below is prefixed with `/api`.

### Auth, open to everyone

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create an account. Accepts an optional avatar |
| POST | `/auth/login` | Exchange credentials for a token |
| POST | `/auth/forgot-password` | Email a reset link |
| POST | `/auth/reset-password/:token` | Set a new password |

Login and registration sit behind a rate limiter allowing 20 requests per 15 minutes per IP address.

### Products

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/product` | Any logged in user | Paginated list. Admins see all, everyone else sees only their own |
| POST | `/product` | Any logged in user | Create, with images |
| GET | `/product/:id` | Any logged in user | Single product with vendor and reviews populated |
| PUT | `/product/:id` | Owner or admin | Update |
| DELETE | `/product/:id` | Owner or admin | Delete |
| POST | `/product/add_review/:productId` | Any logged in user | Leave a review, notifies the vendor |
| GET or POST | `/product/search` | Open, no token needed | Filtered search |

### Users

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/user` | Admin only | Paginated list of accounts |
| GET | `/user/:id` | Self or admin | One account |
| PUT | `/user/:id` | Self or admin | Update. Role and status are admin only |
| DELETE | `/user/:id` | Admin only | Delete an account |

### Notifications and contact

| Method | Path | Purpose |
|---|---|---|
| GET | `/notification` | Your notifications, paginated, with an unread count |
| PUT | `/notification/:id/read` | Mark one as read |
| PUT | `/notification/read-all` | Mark everything as read |
| POST | `/contact` | Send a message to the site owner |

### Socket events

| Direction | Event | Payload |
|---|---|---|
| Client sends | `new-message` | `{ receiverId, message }` |
| Server sends | `reply-message` | A message addressed to you |
| Server sends | `reply-message-own` | Your own message, echoed back |
| Server sends | `users` | Everyone currently online except you |

The connection requires a token in the handshake: `io(url, { auth: { token } })`.

## Deployment

The app runs across three free services. Each was chosen for a specific technical reason rather than convenience.

| Piece | Host | Why |
|---|---|---|
| Database | MongoDB Atlas M0 | Free permanently, 512MB, no card required |
| API | Render free web service | Supports WebSockets and long running processes |
| Frontend | Vercel Hobby | Static files on a CDN, unlimited projects |

Socket.IO is what drives the split. A WebSocket must hold a connection open for minutes, while a serverless function starts, answers and exits. That single requirement means the API cannot live on Vercel alongside the frontend.

### Setting up the database

Create a free M0 cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas). Add a database user under **Database Access**, giving it read and write access to any database, and pick a password made only of letters and digits. A password containing `@`, `:`, `/` or `?` breaks the connection string, because those characters have meaning inside a URL.

Under **Network Access**, choose **Allow Access from Anywhere**, which is `0.0.0.0/0`. Render's free tier has no fixed outbound IP address, so there is nothing specific to permit. The database is still protected by the username and password.

Then take the connection string from **Connect**, choosing **Drivers**, and make two edits. Replace `<db_password>` with the real password, and insert a database name between the `/` and the `?`:

```
mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/marketlydb?retryWrites=true&w=majority
```

Skip that second edit and Mongoose writes everything to a database called `test`, which works but is confusing later and collides if you host a second project on the same cluster.

### Deploying the API

Create a web service on [render.com](https://render.com) pointing at this repository, with **Root Directory** set to `api`, build command `npm install` and start command `npm start`.

Set `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, and `CORS_ORIGIN` and `FRONTEND_URL` as placeholders for now. Do not set `PORT`. Render injects its own and the config already reads it.

### Deploying the frontend

Import the same repository on [vercel.com](https://vercel.com) with **Root Directory** set to `web`. The Vite preset fills in the build command and output directory correctly.

Add the three `VITE_` variables pointing at the Render URL, watching the trailing slashes described earlier.

The [vercel.json](web/vercel.json) file in that folder handles one thing that is easy to miss:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

React Router handles a path like `/product_details/abc` inside the browser. But refreshing that page asks the server for it, and no such file exists in the build output. This rewrite serves `index.html` for every path and lets the router take over. Without it, every refresh and every shared link returns a 404.

### Connecting the two

Go back to Render and set `CORS_ORIGIN` and `FRONTEND_URL` to the real Vercel URL, with no trailing slash. The value is compared against the browser's `Origin` header as an exact string, and that header never carries a trailing slash.

One environment variable fixes both halves of the app, because [app.js](api/app.js) parses it once and passes the result to both Express and Socket.IO:

```js
const corsOrigins = configs.CORS_ORIGIN.split(",").map((s) => s.trim());
// ...
app.use(cors({ origin: corsOrigins }));
// ...
const io = new Server(server, { cors: { origin: corsOrigins } });
```

The split on commas means several origins can be allowed at once, which is useful for running a local frontend against the deployed API:

```
https://your-app.vercel.app,http://localhost:3000
```

### One thing the deployment required in code

Running behind a proxy changes how Express sees the client, so [app.js](api/app.js) carries this line:

```js
app.set("trust proxy", 1);
```

Render terminates HTTPS at a proxy before traffic reaches your app, so every request arrives from the proxy's address with the real client IP in the `X-Forwarded-For` header. Express ignores that header by default, and rightly so, since anyone can forge it. But the consequence here is that the rate limiter would count every user in the world as one visitor, and twenty failed logins from anybody would lock out everybody. The `1` says to trust exactly one proxy hop, which is the correct value for Render.

## Known limitations

These are real, they are known, and each is written down with its cause so nobody has to rediscover it.

**Uploaded images do not survive a restart.** [uploader.js](api/middlewares/uploader.js) writes files to local disk, and Render's free tier has an ephemeral filesystem that resets on every redeploy and every cold start. Product records persist in MongoDB, but the image files they point at do not, so thumbnails break over time. [ViewProducts.component.jsx](web/src/components/Products/ViewProducts/ViewProducts.component.jsx) degrades gracefully with an inline placeholder, but the images are genuinely gone. Fixing this properly means moving uploads to an object store such as Cloudinary or S3 and storing the returned URL instead of a filename.

**The first request after idle is slow.** Render sleeps a free service after fifteen minutes of inactivity, and waking it takes roughly fifty seconds. The HTTP client gives up after twenty:

```js
const http = axios.create({
    baseURL: BASE_URL,
    timeout: 20000,
    timeoutErrorMessage: 'Request Timeout'
})
```

So the first attempt often fails with a timeout even though nothing is wrong. Loading the API URL directly in a tab first wakes it up.

**Chat messages are not persisted.** They exist only in React state and in the server's `connectedUsers` map. Refreshing clears the conversation, and a recipient who is offline never receives the message. Durable chat means writing each message to MongoDB and loading history on connect.

**Deleting a product leaves its image files behind.** The user update handler cleans up a replaced avatar, but the product delete path has no equivalent, so orphaned files accumulate in `uploads/images`.

**Search is unpaginated and unauthenticated.** It returns every match in one response and is the only product route without `authenticate` in front of it. Both are acceptable at demo scale and both need attention before real traffic.

**Roles must be numbers.** [authorization.js](api/middlewares/authorization.js) compares with `includes`, which is strict, so a role stored as the string `"1"` never matches admin. Editing a role by hand in the Atlas UI is the usual way this happens.

**Vercel's Hobby plan is for non commercial use.** Fine for a portfolio project, not for a storefront taking real payments.

## Making the first admin

New accounts always get role 2, and only an existing admin can promote anyone, so the first administrator has to be created directly in the database.

Open your cluster in Atlas, click **Browse Collections**, and find your account in the `users` collection. Edit the document, change `role` from `2` to `1`, and make sure the type stays **Int32** rather than String, for the reason given above.

Then log out and log back in. The role is copied into your token at login, so your current session still carries the old value. After that, every further promotion can be done through the admin panel in the app, which sends the role as a number and cannot produce the type problem.
