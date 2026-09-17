import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { FaPencilAlt, FaTrashAlt } from 'react-icons/fa'
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Loader } from '../../Common/Loader/Loader.component';
import { Pagination } from '../../Common/Pagination/Pagination.component';
import { formatDate } from '../../../utils/dateUtil';
import { fetchProducts_ac, removeProduct_ac } from './../../../slices/productSlice'

const IMG_URL = import.meta.env.VITE_IMG_URL;

// shown when a product has no image, or its image fails to load
const NO_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" rx="6" fill="#e2e8f0"/><text x="30" y="33" font-family="sans-serif" font-size="8" fill="#64748b" text-anchor="middle">no image</text></svg>'
);

export const ViewProducts = ({ productData, resetSearch }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isLoading = useSelector(state => state.product.isLoading);
    const products = useSelector(state => state.product.products);
    const page = useSelector(state => state.product.page);
    const pages = useSelector(state => state.product.pages);
    const total = useSelector(state => state.product.total);

    useEffect(() => {
        // productData means we're showing search results (passed in by
        // SearchProduct) — only hit the Redux-backed full list otherwise.
        if (!productData) {
            dispatch(fetchProducts_ac(1));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const displayedProducts = productData || products;

    const editProduct = id => {
        navigate(`/edit_product/${id}`)
    }

    const removeProduct = (id) => {
        const confirmation = window.confirm("Are you sure to remove?");
        if (confirmation) {
            dispatch(removeProduct_ac(id))
        }
    }

    const content = (isLoading && !productData)
        ? <Loader circular={true} message="show"></Loader>
        : <div className="table-responsive-card">
            <table className="table table-hover align-middle mb-0">
                <thead>
                    <tr>
                        <th>S.N</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Created At</th>
                        <th>Tags</th>
                        <th>Images</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {(displayedProducts || []).map((item, index) => (
                        <tr key={item._id}>
                            <td>{index + 1}</td>
                            <td><Link to={`/product_details/${item._id}`}>{item.name}</Link> </td>
                            <td>{item.category}</td>
                            <td>{item.price}</td>
                            <td>{formatDate(item.createdAt, 'ddd YYYY/MM/DD hh:mm a')}</td>
                            <td>{(item.tags || []).join(',')}</td>
                            <td>
                                <img
                                    src={item.images && item.images[0] ? `${IMG_URL}${item.images[0]}` : NO_IMAGE}
                                    alt={item.name}
                                    width="60"
                                    height="60"
                                    style={{ objectFit: 'cover', borderRadius: '6px', background: '#f1f5f9' }}
                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = NO_IMAGE; }}
                                ></img>
                            </td>
                            <td>
                                <span onClick={() => editProduct(item._id)} title="Edit Product" className="text-primary" style={{ cursor: 'pointer' }}> <FaPencilAlt></FaPencilAlt></span>
                                <span onClick={() => removeProduct(item._id)} title="Remove Product" className="text-danger" style={{ marginLeft: '10px', cursor: 'pointer' }}><FaTrashAlt></FaTrashAlt></span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    return (
        <>
            <h2>View Products</h2>
            {productData && (
                <button onClick={resetSearch} className="btn btn-success" >Search Again</button>
            )}
            {content}
            {!productData && (
                <Pagination page={page} pages={pages} total={total} onChange={(p) => dispatch(fetchProducts_ac(p))}></Pagination>
            )}
        </>
    );
}

ViewProducts.propTypes = {
    productData: PropTypes.array,
    resetSearch: PropTypes.func
}
