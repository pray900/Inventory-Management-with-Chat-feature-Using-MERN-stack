import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductForm } from '../ProductForm/ProductForm.component';
import { ErrorHandler } from './../../../utils/error.handler'
import { httpClient } from './../../../utils/httpClient'
import { notify } from './../../../utils/notify'

export const AddProduct = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const add = (data, files) => {
        setIsSubmitting(true)
        httpClient.UPLOAD('POST', '/product', data, files)
            .then(() => {
                notify.showSuccess('Product Added Successfully')
                navigate('/view_products')
            })
            .catch(err => {
                setIsSubmitting(false)
                ErrorHandler(err)
            })
    }

    return (
        <ProductForm
            isSubmitting={isSubmitting}
            submitCallback={add}
        ></ProductForm>
    );
}
