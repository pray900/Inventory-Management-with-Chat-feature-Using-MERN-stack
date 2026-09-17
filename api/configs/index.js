if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not set. Copy .env.example to .env and set a real secret.",
  ); // gives clean log output
}

module.exports = {
  PORT: process.env.PORT || 4040,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/marketlydb",
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587, // process.env always returns string, so needs type conversion when necessary
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM:
    process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@marketly.local",
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || process.env.SMTP_USER || "",
};
