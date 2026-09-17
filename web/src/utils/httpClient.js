import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const http = axios.create({
    baseURL: BASE_URL,
    responseType: 'json',
    timeout: 20000,
    timeoutErrorMessage: 'Request Timeout'
})

const getHeaders = (isSecured = false) => {
    let options = {
        'Content-Type': 'application/json'
    }

    if (isSecured) {
        options['Authorization'] = `Bearer ${localStorage.getItem('token')}`
    }
    return options;
}

const GET = (url, isSecured = false, params = {}) => {
    return http.get(url, {
        headers: getHeaders(isSecured),
        params
    })
}

const POST = (url, data, isSecured = false, params = {}) => {
    return http.post(url, data, {
        headers: getHeaders(isSecured),
        params
    })
}

const PUT = (url, data, isSecured = false, params = {}) => {
    return http.put(url, data, {
        headers: getHeaders(isSecured),
        params
    })
}

const DELETE = (url, isSecured = false, params = {}) => {
    return http.delete(url, {
        headers: getHeaders(isSecured),
        params
    })
}

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

        const parseBody = () => {
            try { return JSON.parse(xhr.responseText); } catch (e) { return undefined; }
        };

        // Reject with the SAME shape axios uses ({ response: { status, data } }),
        // so ErrorHandler can read error.response.data.msg and show the real
        // server message (e.g. "Product name is required") instead of a generic one.
        xhr.onload = () => {
            const body = parseBody();
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ data: body });
            } else {
                reject({ response: { status: xhr.status, data: body } });
            }
        };
        xhr.onerror = () => reject({ message: 'Network Error' });        // genuinely unreachable
        xhr.ontimeout = () => reject({ code: 'ECONNABORTED', message: 'timeout' });

        xhr.timeout = 20000;
        xhr.open(method, `${BASE_URL}${url}?token=Bearer ${localStorage.getItem('token')}`, true)
        xhr.send(formData)
    })
}

export const httpClient = {
    GET,
    POST,
    PUT,
    DELETE,
    UPLOAD
}