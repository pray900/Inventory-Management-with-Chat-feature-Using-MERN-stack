import { toast } from 'react-toastify';

const showSuccess = (msg) => {
    toast.success(msg)
}
const showInfo = (msg) => {
    toast.info(msg)
}

const showWarning = (msg) => {
    toast.warning(msg)
}

const showError = (msg) => {
    toast.error(msg)
}
export const notify = {
    showSuccess,
    showInfo,
    showWarning,
    showError
};
