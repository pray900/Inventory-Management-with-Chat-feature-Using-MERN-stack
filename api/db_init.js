const mongoose = require("mongoose"); //pull in the MongoDB library
const configs = require("./configs"); // by default looks for index.js file if package.json is not found

mongoose.set("strictQuery", true); // global mongoose setting

async function connectDB() {
  try {
    await mongoose.connect(configs.MONGO_URI); // connect, and wait
    console.log("db connection successful");
  } catch (err) {
    console.error("error in db connection >>>", err);
    process.exit(1); // process represents the running program itself.
  }
}

module.exports = connectDB;
