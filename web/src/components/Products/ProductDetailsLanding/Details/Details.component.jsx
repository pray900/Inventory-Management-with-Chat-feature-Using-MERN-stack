import React from 'react';
import PropTypes from 'prop-types';
import ImageGallery from 'react-image-gallery';
import './Details.component.css'

import "react-image-gallery/styles/css/image-gallery.css";
import { relativeTime } from '../../../../utils/dateUtil';
const IMG_URL = import.meta.env.VITE_IMG_URL;

const getImages = (images = []) => {
    return images.map(img => ({
        original: `${IMG_URL}${img}`,
        thumbnail: 'https://picsum.photos/id/1018/250/150/',
    }))
}

export const Details = ({ product }) => {
    return (
        <div className="row">
            <div className="col-md-6">
                <ImageGallery items={getImages(product.images)}></ImageGallery>
            </div>
            <div className="col-md-6 scrollArea" >
                <h2>{product.name}</h2>
                <pre>{product.description}</pre>

                {(product.reviews || []).map((review, index) => (
                    <div key={index} className="review-card">
                        <p>{review.point}</p>
                        <p>{review.message}</p>
                        <p>{review.user.email}</p>
                        <small>{relativeTime(review.createdAt)}</small>
                    </div>
                ))}
            </div>
        </div>
    );
}

Details.propTypes = {
    product: PropTypes.object.isRequired
}
