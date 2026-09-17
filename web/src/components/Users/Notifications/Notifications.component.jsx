import React, { useState, useEffect, useCallback } from 'react';
import { httpClient } from '../../../utils/httpClient';
import { ErrorHandler } from '../../../utils/error.handler';
import { relativeTime } from '../../../utils/dateUtil';
import { Loader } from '../../Common/Loader/Loader.component';
import { Pagination } from '../../Common/Pagination/Pagination.component';

export const Notifications = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);

    const load = useCallback((targetPage) => {
        setIsLoading(true);
        httpClient.GET('/notification', true, { page: targetPage, limit: 10 })
            .then(response => {
                setNotifications(response.data.data);
                setPage(response.data.page);
                setPages(response.data.pages);
                setTotal(response.data.total);
            })
            .catch(err => ErrorHandler(err))
            .finally(() => setIsLoading(false))
    }, [])

    useEffect(() => {
        load(1);
    }, [load])

    const markRead = (id) => {
        httpClient.PUT(`/notification/${id}/read`, {}, true)
            .then(() => {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
            })
            .catch(err => ErrorHandler(err))
    }

    const markAllRead = () => {
        httpClient.PUT('/notification/read-all', {}, true)
            .then(() => {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            })
            .catch(err => ErrorHandler(err))
    }

    if (isLoading) {
        return <Loader></Loader>
    }

    return (
        <>
            <h2>Notifications</h2>
            {notifications.some(n => !n.read) && (
                <button className="btn btn-outline-secondary btn-sm mb-3" onClick={markAllRead}>Mark all as read</button>
            )}
            {notifications.length === 0
                ? <p>No notifications yet.</p>
                : <div className="table-responsive-card">
                    {notifications.map(n => (
                        <div
                            key={n._id}
                            className="d-flex justify-content-between align-items-center py-2 border-bottom"
                            style={{ opacity: n.read ? 0.6 : 1 }}
                        >
                            <div>
                                <p className="mb-0">{n.message}</p>
                                <small className="text-secondary">{relativeTime(n.createdAt)}</small>
                            </div>
                            {!n.read && (
                                <button className="btn btn-sm btn-outline-primary" onClick={() => markRead(n._id)}>Mark read</button>
                            )}
                        </div>
                    ))}
                </div>
            }
            <Pagination page={page} pages={pages} total={total} onChange={load}></Pagination>
        </>
    )
}
