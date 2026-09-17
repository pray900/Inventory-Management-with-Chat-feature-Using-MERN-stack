import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SubmitButton } from './../../Common/SubmitButton/SubmitButton.component';
import { PasswordInput } from './../../Common/PasswordInput/PasswordInput.component';
import { notify } from './../../../utils/notify'
import { ErrorHandler } from './../../../utils/error.handler'
import { redirectToDashboard } from '../../../services/redirection';
import { httpClient } from '../../../utils/httpClient';

const defaultForm = {
    username: '',
    password: ''
}

export const LoginComponent = () => {
    const navigate = useNavigate();
    const [data, setData] = useState({ ...defaultForm });
    const [error, setError] = useState({ ...defaultForm });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('remember_me') === 'true') {
            navigate('/dashboard', { replace: true })
        }
    }, [navigate])

    const validateForm = (nextData) => {
        const usernameErr = nextData.username ? '' : 'required field*'
        const passwordErr = nextData.password ? '' : 'required field*'
        setError(prev => ({ ...prev, username: usernameErr, password: passwordErr }))
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            return setRememberMe(checked)
        }
        setData(prev => {
            const next = { ...prev, [name]: value };
            if (error[name]) {
                validateForm(next);
            }
            return next;
        })
    }

    const submit = (e) => {
        e.preventDefault();
        setIsSubmitting(true)
        httpClient.POST(`/auth/login`, data)
            .then(response => {
                notify.showSuccess(`Welcome ${response.data.user.username}`)
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user))
                localStorage.setItem('remember_me', rememberMe)
                redirectToDashboard(response.data.user.role, navigate)
            })
            .catch(err => {
                ErrorHandler(err);
                setIsSubmitting(false)
            })
    }

    return (
        <div>
            <h2>Login</h2>
            <p>Please Login to start using hamro application</p>
            <form className="form-group" onSubmit={submit}>
                <label htmlFor="username">Username</label>
                <input className="form-control" type="text" name="username" id="username" placeholder="Username" onChange={handleChange}></input>
                <p className="error">{error.username}</p>
                <label htmlFor="password">Password</label>
                <PasswordInput name="password" id="password" value={data.password} onChange={handleChange}></PasswordInput>
                <p className="error">{error.password}</p>

                <input type="checkbox" name="remember_me" checked={rememberMe} onChange={handleChange}></input>
                <label> &nbsp;Remember Me</label>
                <hr />
                <SubmitButton
                    isSubmitting={isSubmitting}
                    enabledLabel="Login"
                    disabledLabel="Login in..."
                ></SubmitButton>
            </form>
            <br />
            <p>Don't have an account?</p>
            <p style={{ float: 'left' }}>Register <Link to="/register">here</Link></p>
            <p style={{ float: 'right' }}><Link to="/forgot_password">forgot password?</Link></p>
        </div>
    )
}
