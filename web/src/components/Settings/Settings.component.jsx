import React, { useState, useEffect } from 'react';
import { httpClient } from '../../utils/httpClient';
import { ErrorHandler } from '../../utils/error.handler';
import { notify } from '../../utils/notify';
import { Loader } from '../Common/Loader/Loader.component';
import { SubmitButton } from '../Common/SubmitButton/SubmitButton.component';
import { formatDate } from '../../utils/dateUtil';

const defaultForm = {
    name: '',
    email: '',
    phoneNumber: '',
    gender: '',
    dob: '',
    temporaryAddress: '',
    permanentAddress: '',
    password: '',
    confirmPassword: ''
}

export const Settings = () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState({ ...defaultForm });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!currentUser?._id) return;
        httpClient.GET(`/user/${currentUser._id}`, true)
            .then(response => {
                const user = response.data;
                setData({
                    ...defaultForm,
                    name: user.name || '',
                    email: user.email || '',
                    phoneNumber: user.phoneNumber || '',
                    gender: user.gender || '',
                    dob: user.dob ? formatDate(user.dob, 'YYYY-MM-DD') : '',
                    temporaryAddress: (user.address?.temporaryAddress || []).join(','),
                    permanentAddress: user.address?.permanentAddress || ''
                })
            })
            .catch(err => ErrorHandler(err))
            .finally(() => setIsLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleChange = e => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = e => {
        e.preventDefault();
        if (data.password && data.password !== data.confirmPassword) {
            return notify.showError('Passwords do not match')
        }
        setIsSubmitting(true)
        const payload = { ...data };
        if (!payload.password) {
            delete payload.password;
        }
        delete payload.confirmPassword;

        httpClient.PUT(`/user/${currentUser._id}`, payload, true)
            .then(response => {
                notify.showSuccess('Settings updated');
                localStorage.setItem('user', JSON.stringify(response.data));
                setData(prev => ({ ...prev, password: '', confirmPassword: '' }))
            })
            .catch(err => ErrorHandler(err))
            .finally(() => setIsSubmitting(false))
    }

    if (isLoading) {
        return <Loader></Loader>
    }

    return (
        <>
            <h2>Settings</h2>
            <p>Update your profile.</p>
            <form className="form-group" noValidate onSubmit={handleSubmit}>
                <label>Name</label>
                <input type="text" name="name" value={data.name} className="form-control" onChange={handleChange}></input>
                <label>Email</label>
                <input type="email" name="email" value={data.email} className="form-control" onChange={handleChange}></input>
                <label>Phone Number</label>
                <input type="number" name="phoneNumber" value={data.phoneNumber} className="form-control" onChange={handleChange}></input>
                <label>Gender</label>
                <br></br>
                <input type="radio" name="gender" value="male" checked={data.gender === 'male'} onChange={handleChange}></input>Male
                &nbsp;<input type="radio" name="gender" value="female" checked={data.gender === 'female'} onChange={handleChange}></input>Female
                &nbsp;<input type="radio" name="gender" value="others" checked={data.gender === 'others'} onChange={handleChange}></input>Others
                <br></br>
                <label>Date Of Birth</label>
                <input type="date" name="dob" value={data.dob} className="form-control" onChange={handleChange}></input>
                <label>Temporary Address</label>
                <input type="text" name="temporaryAddress" value={data.temporaryAddress} className="form-control" onChange={handleChange}></input>
                <label>Permanent Address</label>
                <input type="text" name="permanentAddress" value={data.permanentAddress} className="form-control" onChange={handleChange}></input>
                <label>New Password</label>
                <input type="password" name="password" value={data.password} placeholder="Leave blank to keep current password" className="form-control" onChange={handleChange}></input>
                <label>Confirm New Password</label>
                <input type="password" name="confirmPassword" value={data.confirmPassword} className="form-control" onChange={handleChange}></input>
                <hr />
                <SubmitButton isSubmitting={isSubmitting} enabledLabel="Save" disabledLabel="Saving..."></SubmitButton>
            </form>
        </>
    )
}
