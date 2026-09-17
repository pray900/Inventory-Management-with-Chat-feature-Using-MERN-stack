import React from 'react';
import './Footer.component.css';

export const Footer = () => {
    return (
        <footer className="app-footer">
            <p>&copy; {new Date().getFullYear()} Marketly</p>
        </footer>
    )
}
