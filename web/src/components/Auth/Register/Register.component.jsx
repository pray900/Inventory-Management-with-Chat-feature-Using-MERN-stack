import React, { useState } from 'react';
import { SubmitButton } from '../../Common/SubmitButton/SubmitButton.component';
import { PasswordInput } from '../../Common/PasswordInput/PasswordInput.component';
import { Link, useNavigate } from 'react-router-dom';
import { notify } from './../../../utils/notify'
import { httpClient } from '../../../utils/httpClient';
import { ErrorHandler } from '../../../utils/error.handler';

const defaultForm = {
    name: '',
    email: '',
    phoneNumber: '',
    username: '',
    password: '',
    confirmPassword: '',
    gender: '',
    dob: '',
    temporaryAddress: '',
    permanentAddress: ''
}

// The fields the user must fill in. Email is intentionally NOT here — the API
// treats email as optional, so the form should too.
const requiredFields = ['name', 'username', 'password', 'confirmPassword'];

// Build the full error object for the current form data. An empty required
// field gets 'required field*'; anything else beyond that (length, email format,
// duplicates) is left to the backend, which returns clear messages of its own.
const computeErrors = (d) => {
    const e = { ...defaultForm };
    requiredFields.forEach(field => {
        if (!String(d[field] || '').trim()) {
            e[field] = 'required field*';
        }
    });
    if (d.password && d.confirmPassword && d.password !== d.confirmPassword) {
        e.confirmPassword = 'password did not match';
    }
    return e;
}

export const RegisterComponent = () => {
    const navigate = useNavigate();
    const [data, setData] = useState({ ...defaultForm });
    const [error, setError] = useState({ ...defaultForm });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const handleChange = e => {
        const { name, value } = e.target;
        setData(prev => {
            const next = { ...prev, [name]: value };
            // Once they've attempted to submit, keep the messages live so each
            // 'required field*' disappears as its field is filled in.
            if (hasSubmitted) setError(computeErrors(next));
            return next;
        })
    }

    const handleSubmit = e => {
        e.preventDefault();
        setHasSubmitted(true);
        const errs = computeErrors(data);
        setError(errs);
        if (Object.values(errs).some(Boolean)) {
            return; // stop here — the required-field messages are now shown
        }
        setIsSubmitting(true)
        httpClient.POST(`/auth/register`, data)
            .then(() => {
                notify.showSuccess('Registration successful! Please log in.');
                navigate('/')
            })
            .catch(err => {
                ErrorHandler(err)
                setIsSubmitting(false)
            })
    }

    return (
        <div>
            <h2>Register</h2>
            <p>Please Register to continue</p>
            <form className="form-group" onSubmit={handleSubmit} noValidate>
                <label>Name</label>
                <input type="text" name="name" placeholder="Name" className="form-control" value={data.name} onChange={handleChange}></input>
                <p className="error">{error.name}</p>
                <label>Email</label>
                <input type="email" name="email" placeholder="Email (optional)" className="form-control" value={data.email} onChange={handleChange}></input>
                <p className="error">{error.email}</p>
                <label>Phone Number</label>
                <input type="number" name="phoneNumber" className="form-control" value={data.phoneNumber} onChange={handleChange}></input>
                <label>Username</label>
                <input type="text" name="username" placeholder="Username" className="form-control" value={data.username} onChange={handleChange}></input>
                <p className="error">{error.username}</p>
                <label>Password</label>
                <PasswordInput name="password" placeholder="Password" value={data.password} onChange={handleChange}></PasswordInput>
                <p className="error">{error.password}</p>
                <label>Confirm Password</label>
                <PasswordInput name="confirmPassword" placeholder="Confirm Password" value={data.confirmPassword} onChange={handleChange}></PasswordInput>
                <p className="error">{error.confirmPassword}</p>
                <label>Gender</label>
                <br></br>
                <input type="radio" name="gender" value="male" checked={data.gender === 'male'} onChange={handleChange}></input>Male
                &nbsp;<input type="radio" name="gender" value="female" checked={data.gender === 'female'} onChange={handleChange}></input>Female
                &nbsp;<input type="radio" name="gender" value="others" checked={data.gender === 'others'} onChange={handleChange}></input>Others
                <br></br>

                <label>Date Of Birth</label>
                <input type="date" name="dob" className="form-control" value={data.dob} onChange={handleChange}></input>
                <label>Temporary Address</label>
                <input type="text" name="temporaryAddress" placeholder="Temporary Address" className="form-control" value={data.temporaryAddress} onChange={handleChange}></input>
                <label>Permanent Address</label>
                <input type="text" name="permanentAddress" placeholder="Permanent Address" className="form-control" value={data.permanentAddress} onChange={handleChange}></input>
                <hr></hr>
                <SubmitButton
                    isSubmitting={isSubmitting}
                ></SubmitButton>
            </form>
            <p>Already Registered?</p>
            <p>Back to <Link to="/">login</Link></p>
        </div>
    )
}
