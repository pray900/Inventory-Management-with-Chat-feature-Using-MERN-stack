import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProduct_ac, addReview_ac } from '../../../slices/productSlice';
import { Loader } from './../../Common/Loader/Loader.component'
import { AddReview } from './AddReview/AddReview.component';
import { Details } from './Details/Details.component';

export const ProductDetailsLanding = () => {
    const { id: productId } = useParams();
    const dispatch = useDispatch();
    const isProductLoading = useSelector(state => state.product.isProductLoading);
    const product = useSelector(state => state.product.product);
    const isReviewSubmitting = useSelector(state => state.product.isReviewSubmitting);

    useEffect(() => {
        dispatch(fetchProduct_ac({ id: productId }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId])

    const submitReview = reviewData => {
        dispatch(addReview_ac({ reviewData, productId }))
    }

    return isProductLoading
        ? <Loader></Loader>
        : <>
            <Details product={product}></Details>
            <hr></hr>
            <AddReview submitting={isReviewSubmitting} addReview={submitReview}></AddReview>
        </>
}
