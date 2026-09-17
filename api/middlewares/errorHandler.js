const AppError = require('./../utils/AppError');

// Every branch returns `msg` as a plain, human-readable STRING. The frontend
// (src/utils/error.handler.js) just shows `error.response.data.msg` in a toast,
// so the clearer the string here, the clearer the message the user sees.
module.exports = function (err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.status).json({ msg: err.msg, status: err.status });
    }

    if (err.name === 'ValidationError') {
        // Mongoose schema validation: collect the per-field messages into one line
        const messages = Object.values(err.errors).map(function (e) { return e.message; });
        return res.status(400).json({ msg: messages.join(', '), status: 400 });
    }

    if (err.name === 'CastError') {
        // e.g. a malformed id in the URL — say which field and value were bad
        return res.status(400).json({ msg: `Invalid value '${err.value}' for '${err.path}'`, status: 400 });
    }

    if (err.code === 11000) {
        // duplicate unique field — name the field and the value that clashed
        const field = Object.keys(err.keyValue || {})[0];
        const value = field ? err.keyValue[field] : '';
        return res.status(409).json({ msg: `${value} is already taken (${field})`, status: 409 });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ msg: 'Invalid authentication token', status: 401 });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ msg: 'Session expired, please log in again', status: 401 });
    }

    // A malformed/oversized upload is a CLIENT error, not a server crash.
    // Covers MISSING_FIELD_NAME, LIMIT_FILE_SIZE, LIMIT_UNEXPECTED_FILE, etc.
    if (err.name === 'MulterError') {
        return res.status(400).json({ msg: 'File upload error: ' + err.message, status: 400 });
    }

    if (err.status) {
        return res.status(err.status).json({ msg: err.msg || err.message, status: err.status });
    }

    console.error('unhandled error >>', err);
    res.status(500).json({ msg: 'Internal Server Error', status: 500 });
}
