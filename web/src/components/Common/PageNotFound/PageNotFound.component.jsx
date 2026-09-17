import React from 'react';
import { Link } from 'react-router-dom';

export const PageNotFound = () => {
    return (
        <div>
            <h2>Page Not Found</h2>
            <img src="/images/notfound.jpg" alt="notfound.jpg" width="400px"></img>
            <p><Link to="/dashboard">Back to dashboard</Link></p>
        </div>
    )
}
