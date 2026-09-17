import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorHandler } from '../../../utils/error.handler';
import { httpClient } from '../../../utils/httpClient';
import { notify } from '../../../utils/notify';
import { SubmitButton } from '../../Common/SubmitButton/SubmitButton.component';

export const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [emailErr, setEmailErr] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = e => {
        const value = e.target.value;
        setEmail(value)
        setEmailErr(value
            ? (value.includes('@') && value.includes('.com') ? '' : 'invalid email')
            : 'required field*')
    }

    const send = e => {
        e.preventDefault();
        if (!email) return;
        setIsSubmitting(true)
        httpClient.POST('/auth/forgot-password', { email })
            .then(() => {
                notify.showInfo("Password reset link sent to your email please check your inbox");
                navigate('/');
            })
            .catch(err => {
                ErrorHandler(err);
                setIsSubmitting(false)
            })
    }

    return (
        <div>
            <h2>Forgot Password</h2>
            <p>Please provide your email address to reset your password</p>
            <form noValidate onSubmit={send} className="form-group">
                <label>Email</label>
                <input type="text" name="email" placeholder="Email Address here..." className="form-control" onChange={handleChange}></input>
                <p className="error">{emailErr}</p>
                <hr />
                <SubmitButton
                    isSubmitting={isSubmitting}
                    isDisabled={emailErr}
                ></SubmitButton>
            </form>
        </div>
    );
}
