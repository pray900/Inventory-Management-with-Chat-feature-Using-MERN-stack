require("dotenv").config(); // reads .env, dumps each line into process.env

const http = require("http");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { Server } = require("socket.io"); // or Server = require('socket.io').Server

const configs = require("./configs");
const connectDB = require("./db_init");
const API_ROUTE = require("./routes/api.route");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const initChatSocket = require("./sockets/chat.socket");

const app = express();
// Render terminates TLS at a proxy, so the real client IP arrives in
// X-Forwarded-For. Without this, express-rate-limit sees every request as
// coming from one address and the auth limiter locks out all users at once.
app.set("trust proxy", 1);
const server = http.createServer(app); // get server instead of app.listen(port) because we need server for chat function
const corsOrigins = configs.CORS_ORIGIN.split(",").map((s) => s.trim());

connectDB();

app.use(helmet()); //add security headers
app.use(cors({ origin: corsOrigins })); //allow the web app's origin
app.use(morgan("dev")); //log the request
app.use(express.urlencoded({ extended: true })); //parse form-encoded bodies
app.use(express.json()); //parse JSON bodies → req.body
// Product images are loaded by the web app from a different origin (:3000 -> :4040),
// so relax helmet's Cross-Origin-Resource-Policy for these static files only —
// otherwise the browser blocks the <img> loads even though the files serve fine.
app.use(
  "/file",
  function (req, res, next) {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(process.cwd(), "uploads"))
); // serve uploaded images

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter); // rate-limit login/register

app.use("/api", API_ROUTE); // actual endpoints

app.use(notFound); // nothing matched → 404
app.use(errorHandler); // any error

const io = new Server(server, {
  cors: { origin: corsOrigins },
});
initChatSocket(io);

server.listen(configs.PORT, function () {
  console.log("server listening at port " + configs.PORT);
  console.log("press CTRL + C to exit");
});
