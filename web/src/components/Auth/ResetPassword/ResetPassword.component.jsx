import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorHandler } from '../../../utils/error.handler';
import { httpClient } from '../../../utils/httpClient';
import { notify } from '../../../utils/notify';
import { SubmitButton } from '../../Common/SubmitButton/SubmitButton.component';

const defaultForm = {
    password: '',
    confirmPassword: ''
}

export const ResetPassword = () => {
    const navigate = useNavigate();
    const { token: resetToken } = useParams();
    const [data, setData] = useState({ ...defaultForm });
    const [error, setError] = useState({ ...defaultForm });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidForm, setIsValidForm] = useState(false);

    const validateForm = (fieldName, nextData) => {
        let errMsg;
        switch (fieldName) {
            case 'password':
                errMsg = nextData.confirmPassword
                    ? (nextData.confirmPassword === nextData.password ? '' : 'password didnot match')
                    : (nextData.password
                        ? (nextData.password.length > 8 ? '' : 'weak password')
                        : 'required field*')
                break;
            case 'confirmPassword':
                errMsg = nextData.password
                    ? (nextData.confirmPassword === nextData.password ? '' : 'password didnot match')
                    : (nextData.confirmPassword
                        ? (nextData.confirmPassword.length > 8 ? '' : 'weak password')
                        : 'required field*')
                break;
            default:
                break;
        }

        setError(prevError => {
            const nextError = { ...prevError, [fieldName]: errMsg };
            const errors = Object.values(nextError).filter(err => err);
            setIsValidForm(errors.length === 0)
            return nextError;
        })
    }

    const handleChange = e => {
        const { name, value } = e.target;
        setData(prev => {
            const next = { ...prev, [name]: value };
            validateForm(name, next);
            return next;
        })
    }

    const handleSubmit = e => {
        e.preventDefault();
        setIsSubmitting(true)
        httpClient.POST(`/auth/reset-password/${resetToken}`, data)
            .then(() => {
                notify.showInfo("Password Reset Successfull please login.")
                navigate('/');
            })
            .catch(err => {
                ErrorHandler(err);
                setIsSubmitting(false)
            })
    }

    return (
        <div>
            <h2>Reset Password</h2>
            <p>Please choose your new password</p>
            <form className="form-group" noValidate onSubmit={handleSubmit}>
                <label>Password</label>
                <input type="password" name="password" placeholder="Password" className="form-control" onChange={handleChange}></input>
                <p className="error">{error.password}</p>
                <label>Confirm Password</label>
                <input type="password" name="confirmPassword" placeholder="Confirm Password" className="form-control" onChange={handleChange}></input>
                <p className="error">{error.confirmPassword}</p>
                <hr></hr>
                <SubmitButton
                    isSubmitting={isSubmitting}
                    isDisabled={!isValidForm}
                ></SubmitButton>
            </form>
            <p>back to <Link to="/">login</Link></p>
        </div>
    );
}
