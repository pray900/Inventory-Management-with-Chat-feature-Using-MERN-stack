import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { SubmitButton } from '../../../Common/SubmitButton/SubmitButton.component'

const defaultForm = {
    reviewPoint: '',
    reviewMessage: ''
}

export const AddReview = ({ addReview, submitting }) => {
    const [data, setData] = useState({ ...defaultForm });

    const handleChange = e => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = e => {
        e.preventDefault();
        addReview(data);
        setData({ ...defaultForm })
    }

    return (
        <div>
            <h2>Add Review</h2>
            <form onSubmit={handleSubmit} className="form-group" noValidate>
                <label>Point</label>
                <input className="form-control" value={data.reviewPoint} type="number" min="1" max="5" name="reviewPoint" onChange={handleChange}></input>
                <label>Messages</label>
                <input className="form-control" value={data.reviewMessage} type="text" name="reviewMessage" onChange={handleChange} placeholder="Rating Messgae here..."></input>
                <br></br>
                <SubmitButton
                    isSubmitting={submitting}
                ></SubmitButton>
            </form>
        </div>
    );
}

AddReview.propTypes = {
    addReview: PropTypes.func.isRequired,
    submitting: PropTypes.bool
}
