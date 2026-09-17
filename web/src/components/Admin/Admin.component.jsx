import React, { useState, useEffect, useCallback } from 'react';
import { httpClient } from '../../utils/httpClient';
import { ErrorHandler } from '../../utils/error.handler';
import { notify } from '../../utils/notify';
import { Loader } from '../Common/Loader/Loader.component';
import { Pagination } from '../Common/Pagination/Pagination.component';
import { ROLES } from '../../constants/roles';

const roleLabel = {
    [ROLES.ADMIN]: 'Admin',
    [ROLES.USER]: 'User',
    [ROLES.VISITOR]: 'Visitor'
}

export const Admin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

    const load = useCallback((targetPage) => {
        setIsLoading(true);
        httpClient.GET('/user', true, { page: targetPage, limit: 10 })
            .then(response => {
                setUsers(response.data.data);
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

    const changeRole = (user, role) => {
        httpClient.PUT(`/user/${user._id}`, { role: Number(role) }, true)
            .then(() => {
                notify.showSuccess(`${user.username} is now ${roleLabel[role]}`)
                setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: Number(role) } : u))
            })
            .catch(err => ErrorHandler(err))
    }

    // `status` (not `isArchived`) is what auth.controller.js actually
    // checks to block login — this is the toggle that does something.
    const toggleStatus = (user) => {
        const status = user.status === 'inactive' ? 'active' : 'inactive';
        httpClient.PUT(`/user/${user._id}`, { status }, true)
            .then(() => {
                notify.showSuccess(`${user.username} ${status === 'inactive' ? 'deactivated' : 'reactivated'}`)
                setUsers(prev => prev.map(u => u._id === user._id ? { ...u, status } : u))
            })
            .catch(err => ErrorHandler(err))
    }

    if (isLoading) {
        return <Loader></Loader>
    }

    return (
        <>
            <h2>Admin</h2>
            <p>Manage user roles and account status.</p>
            <div className="table-responsive-card">
                <table className="table table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>
                                    <select
                                        className="form-control form-control-sm"
                                        style={{ width: 'auto', display: 'inline-block' }}
                                        value={user.role}
                                        disabled={user._id === currentUser?._id}
                                        onChange={(e) => changeRole(user, e.target.value)}
                                    >
                                        <option value={ROLES.ADMIN}>Admin</option>
                                        <option value={ROLES.USER}>User</option>
                                        <option value={ROLES.VISITOR}>Visitor</option>
                                    </select>
                                </td>
                                <td>
                                    {user.status === 'inactive'
                                        ? <span className="badge text-bg-secondary">Deactivated</span>
                                        : <span className="badge text-bg-success">Active</span>}
                                </td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        disabled={user._id === currentUser?._id}
                                        onClick={() => toggleStatus(user)}
                                    >
                                        {user.status === 'inactive' ? 'Reactivate' : 'Deactivate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination page={page} pages={pages} total={total} onChange={load}></Pagination>
        </>
    )
}
