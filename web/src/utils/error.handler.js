import { notify } from './notify';

export const ErrorHandler = (error) => {
    // 1. The server replied in our standard shape { msg } → show that message
    //    (e.g. "Invalid Username", "Expiry date cannot be in the past").
    const serverMsg = error && error.response && error.response.data && error.response.data.msg;
    if (serverMsg) {
        const text = typeof serverMsg === 'object' ? extractDbErrorMessage(serverMsg) : serverMsg;
        return notify.showError(text);
    }

    // 2. The server replied, but not in our shape (e.g. the rate limiter) → map by status.
    if (error && error.response) {
        const status = error.response.status;
        if (status === 429) {
            return notify.showError('Too many attempts. Please wait a minute and try again.');
        }
        return notify.showError(`Request failed (${status}). Please try again.`);
    }

    // 3. No response at all → a timeout, or the server is unreachable
    //    (API not running / network down / CORS). Say so, instead of "Something Went Wrong".
    if (error && (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || ''))) {
        return notify.showError('The request timed out. Please try again.');
    }
    return notify.showError('Cannot reach the server. Please check that the API is running and try again.');
}

function extractDbErrorMessage(error) {
    switch (error.code) {
        case 11000: {
            const key = Object.keys(error.keyValue)[0]
            const value = error.keyValue[key];
            return `${value} already taken for property ${key}`
        }
        default:
            return 'A database error occurred. Please try again.'
    }
}
