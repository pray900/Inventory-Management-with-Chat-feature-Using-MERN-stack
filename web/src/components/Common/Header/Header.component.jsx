import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Header.component.css';

const activeClass = ({ isActive }) => (isActive ? 'selected' : '');

export const Header = ({ isLoggedIn }) => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

    const logout = () => {
        localStorage.clear();
        navigate('/')
    }

    const content = isLoggedIn
        ? <ul className="nav_list">
            <li className="nav_item"><NavLink className={activeClass} to="/dashboard">Dashboard</NavLink> </li>
            <li className="nav_item"><NavLink className={activeClass} to="/about">About</NavLink> </li>
            <li className="nav_item"><NavLink className={activeClass} to="/contact">Contact</NavLink> </li>
            <li className="nav_item"><NavLink className={activeClass} to="/settings">Settings</NavLink> </li>
            <li className="nav_item logout">
                <span style={{ marginRight: '5px' }}>{currentUser?.username}</span>
                <button onClick={logout} className="btn btn-outline-secondary btn-sm">Logout</button>
            </li>
        </ul>
        :
        <ul className="nav_list">
            <li className="nav_item"><NavLink className={activeClass} to="/dashboard">HOME</NavLink> </li>
            <li className="nav_item"><NavLink className={activeClass} to="/" end>LOGIN</NavLink> </li>
            <li className="nav_item"><NavLink className={activeClass} to="/register">REGISTER</NavLink> </li>
        </ul>
    return (
        <div className="nav_bar">
            {content}
        </div>
    )
}
