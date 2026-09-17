import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorHandler } from '../../../utils/error.handler';
import { httpClient } from '../../../utils/httpClient';
import { notify } from '../../../utils/notify';
import { Loader } from '../../Common/Loader/Loader.component';
import { ProductForm } from '../ProductForm/ProductForm.component';

export const EditProduct = () => {
    const navigate = useNavigate();
    const { id: productId } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [product, setProduct] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true)
        httpClient.GET(`/product/${productId}`, true)
            .then(response => {
                if (!cancelled) setProduct(response.data)
            })
            .catch(err => ErrorHandler(err))
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })
        return () => { cancelled = true }
    }, [productId])

    const edit = (data, filesToUpload = [], filesToRemove = []) => {
        setIsSubmitting(true)
        // Only send editable fields. Server-managed fields must NOT be resent —
        // in particular `images` collides with the file-upload field name and
        // corrupts the stored image list. New files go via `filesToUpload`.
        const { images, reviews, _id, __v, createdAt, updatedAt, discount, vendor, ...editable } = data;
        const requestData = {
            ...editable,
            vendor: vendor && vendor._id ? vendor._id : vendor,
            filesToRemove
        }
        httpClient.UPLOAD('PUT', `/product/${productId}`, requestData, filesToUpload)
            .then(() => {
                notify.showInfo("Product Updated Successfully");
                navigate('/view_products')
            })
            .catch(err => {
                ErrorHandler(err)
                setIsSubmitting(false)
            })
    }

    return isLoading
        ? <Loader></Loader>
        : <ProductForm
            isEdit={true}
            submitCallback={edit}
            isSubmitting={isSubmitting}
            productData={product}
        ></ProductForm>
}
