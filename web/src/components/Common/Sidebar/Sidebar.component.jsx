import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { httpClient } from '../../../utils/httpClient';
import { ROLES } from '../../../constants/roles';
import './Sidebar.component.css';

export const Sidebar = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

    useEffect(() => {
        httpClient.GET('/notification', true, { page: 1, limit: 1 })
            .then(response => setUnreadCount(response.data.unreadCount))
            .catch(() => {})
    }, [])

    return (
        <div className="sidebar">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/add_product">Add Product</NavLink>
            <NavLink to="/view_products">View Product</NavLink>
            <NavLink to="/search_product">Search Product</NavLink>
            <hr></hr>
            <NavLink to="/chat">Messages</NavLink>
            <NavLink to="/notifications">
                Notifications {unreadCount > 0 && <span className="badge text-bg-danger">{unreadCount}</span>}
            </NavLink>
            {currentUser?.role === ROLES.ADMIN && (
                <>
                    <hr></hr>
                    <NavLink to="/admin">Admin</NavLink>
                </>
            )}
        </div>
    )
}
