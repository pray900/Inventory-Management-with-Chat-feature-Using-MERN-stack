import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

// A password field with a show/hide (eye) toggle. Drop-in replacement for a
// plain <input type="password" className="form-control" .../>.
export const PasswordInput = ({ name, id, placeholder = 'Password', value, onChange }) => {
    const [show, setShow] = useState(false);

    return (
        <div style={{ position: 'relative' }}>
            <input
                type={show ? 'text' : 'password'}
                name={name}
                id={id}
                placeholder={placeholder}
                className="form-control"
                style={{ paddingRight: '2.5rem' }}
                value={value}
                onChange={onChange}
            ></input>
            <span
                role="button"
                tabIndex={0}
                aria-label={show ? 'Hide password' : 'Show password'}
                title={show ? 'Hide password' : 'Show password'}
                onClick={() => setShow(s => !s)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShow(s => !s); } }}
                style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: 'var(--text-secondary, #64748b)',
                    display: 'flex'
                }}
            >
                {show ? <FaEyeSlash></FaEyeSlash> : <FaEye></FaEye>}
            </span>
        </div>
    );
};

PasswordInput.propTypes = {
    name: PropTypes.string.isRequired,
    id: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired
};
