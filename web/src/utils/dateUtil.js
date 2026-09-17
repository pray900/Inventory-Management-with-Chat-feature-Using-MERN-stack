import dayjs from 'dayjs';
import relativeTimePlugin from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTimePlugin);

export const formatDate = (date, format = 'YYYY-MM-DD') => {
    if (!date) return;
    return dayjs(date).format(format)
}
export const relativeTime = (date, type = "hour") => {
    if (!date) return;
    return dayjs(date).startOf(type).fromNow();
}
