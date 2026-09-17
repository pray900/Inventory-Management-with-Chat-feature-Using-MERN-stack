import React, { useState } from 'react';
import { httpClient } from '../../utils/httpClient';
import { ErrorHandler } from '../../utils/error.handler';
import { notify } from '../../utils/notify';
import { SubmitButton } from '../Common/SubmitButton/SubmitButton.component';

const defaultForm = { subject: '', message: '' }

export const Contact = () => {
    const [data, setData] = useState({ ...defaultForm });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = e => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = e => {
        e.preventDefault();
        setIsSubmitting(true)
        httpClient.POST('/contact', data, true)
            .then(() => {
                notify.showSuccess('Message sent, thanks for reaching out!')
                setData({ ...defaultForm })
            })
            .catch(err => ErrorHandler(err))
            .finally(() => setIsSubmitting(false))
    }

    return (
        <>
            <h2>Contact</h2>
            <p>Questions or feedback? Send us a message.</p>
            <form className="form-group" noValidate onSubmit={handleSubmit}>
                <label>Subject</label>
                <input type="text" name="subject" value={data.subject} placeholder="Subject" className="form-control" onChange={handleChange}></input>
                <label>Message</label>
                <textarea rows={6} name="message" value={data.message} placeholder="Your message..." className="form-control" onChange={handleChange}></textarea>
                <hr />
                <SubmitButton isSubmitting={isSubmitting} enabledLabel="Send" disabledLabel="Sending..."></SubmitButton>
            </form>
        </>
    )
}
