import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaTrashAlt } from 'react-icons/fa';
import { formatDate } from '../../../utils/dateUtil';
import { SubmitButton } from './../../Common/SubmitButton/SubmitButton.component';

const IMG_URL = import.meta.env.VITE_IMG_URL;

const defaultForm = {
    name: '',
    category: '',
    price: '',
    brand: '',
    color: '',
    costPrice: '',
    description: '',
    quantity: '',
    modelNo: '',
    sku: '',
    manuDate: '',
    expiryDate: '',
    purchasedDate: '',
    salesDate: '',
    discountedItem: '',
    discountType: '',
    discountValue: '',
    isReturnEligible: '',
    warrentyStatus: '',
    warrentyPeriod: '',
    origin: '',
    tags: '',
    offers: '',
}

export const ProductForm = ({ isEdit, isSubmitting, productData, submitCallback }) => {
    const [data, setData] = useState({ ...defaultForm });
    const [filesToUpload, setFilesToUpload] = useState([]);
    const [filesToPreview, setFilesToPreview] = useState([]);
    const [filesToRemove, setFilesToRemove] = useState([]);

    useEffect(() => {
        if (!productData) return;
        const previousImages = (productData.images || []).map(item => `${IMG_URL}${item}`)
        setData({
            ...defaultForm,
            ...productData,
            discountedItem: productData.discount && productData.discount.discountedItem
                ? productData.discount.discountedItem
                : false,
            discountType: productData.discount && productData.discount.discountType
                ? productData.discount.discountType
                : '',
            discountValue: productData.discount && productData.discount.discountValue
                ? productData.discount.discountValue
                : '',
            manuDate: productData.manuDate ? formatDate(productData.manuDate, 'YYYY-MM-DD') : '',
            expiryDate: productData.expiryDate ? formatDate(productData.expiryDate, 'YYYY-MM-DD') : '',
            purchasedDate: productData.purchasedDate ? formatDate(productData.purchasedDate, 'YYYY-MM-DD') : '',
            salesDate: productData.salesDate ? formatDate(productData.salesDate, 'YYYY-MM-DD') : ''
        })
        setFilesToPreview(previousImages)
    }, [productData])

    const handleChange = e => {
        let { name, value, type, checked, files } = e.target;

        if (type === 'file') {
            // The file input has no `name`, so it must NOT fall through to the
            // setData below — that would add an empty-string key to `data`, which
            // becomes a nameless multipart field and makes multer reject the upload.
            if (files[0]) setFilesToUpload(prev => [...prev, files[0]])
            return;
        }
        if (type === 'checkbox') {
            value = checked
        }
        setData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = e => {
        e.preventDefault();
        submitCallback(data, filesToUpload, filesToRemove)
    }

    const removeImage = (type, index, file) => {
        if (type === 'new') {
            setFilesToUpload(prev => prev.filter((_, i) => i !== index))
        }
        if (type === 'old') {
            setFilesToPreview(prev => prev.filter((_, i) => i !== index))
            setFilesToRemove(prev => [...prev, file])
        }
    }

    const title = `${isEdit ? 'Update' : 'Add'} Product`;
    const discountContent = data.discountedItem
        ? <>
            <label>Discount Type</label>
            <select name="discountType" value={data.discountType} className="form-control" onChange={handleChange}>
                <option value="">(Select Discount Type)</option>
                <option value="percentage">Percentage</option>
                <option value="quantity">Quantity</option>
                <option value="value">Value</option>
            </select>
            <label>Discount Value</label>
            <input type="text" value={data.discountValue} name="discountValue" placeholder="Discount Value" className="form-control" onChange={handleChange}></input>
        </>
        : ''
    return (
        <>
            <h2>{title}</h2>
            <p>{`Please ${isEdit ? 'Update' : 'Add'} necessary details`}</p>
            <form className="form-group" onSubmit={handleSubmit} noValidate>
                <label>Name</label>
                <input type="text" name="name" value={data.name} placeholder="Name" className="form-control" onChange={handleChange}></input>
                <label>Description</label>
                <textarea rows={8} name="description" value={data.description} placeholder="Description" className="form-control" onChange={handleChange}></textarea>
                <label>Category</label>
                <input type="text" name="category" value={data.category} placeholder="Category" className="form-control" onChange={handleChange}></input>
                <label>Brand</label>
                <input type="text" name="brand" value={data.brand} placeholder="Brand" className="form-control" onChange={handleChange}></input>
                <label>Color</label>
                <input type="text" name="color" value={data.color} placeholder="Color" className="form-control" onChange={handleChange}></input>
                <label>Price</label>
                <input type="number" name="price" value={data.price} placeholder="Price" className="form-control" onChange={handleChange}></input>
                <label>Cost Price</label>
                <input type="number" name="costPrice" value={data.costPrice} placeholder="Cost Price" className="form-control" onChange={handleChange}></input>
                <label>Quantity</label>
                <input type="number" name="quantity" value={data.quantity} placeholder="Quantity" className="form-control" onChange={handleChange}></input>
                <label>Model No.</label>
                <input type="text" name="modelNo" value={data.modelNo} placeholder="Model No." className="form-control" onChange={handleChange}></input>
                <label>SKU Number</label>
                <input type="text" name="sku" value={data.sku} placeholder="SKU Number" className="form-control" onChange={handleChange}></input>
                <label>Manu Date</label>
                <input type="date" name="manuDate" value={data.manuDate} className="form-control" onChange={handleChange}></input>
                <label>Expiry Date</label>
                <input type="date" name="expiryDate" value={data.expiryDate} placeholder="Expiry Date" className="form-control" onChange={handleChange}></input>
                <label>Purchased Date</label>
                <input type="date" name="purchasedDate" value={data.purchasedDate} className="form-control" onChange={handleChange}></input>
                <label>Sales Date</label>
                <input type="date" name="salesDate" value={data.salesDate} className="form-control" onChange={handleChange}></input>
                <input type="checkbox" checked={data.discountedItem} name="discountedItem" onChange={handleChange}></input>
                <label>&nbsp;Discounted Item</label>
                <br />
                {discountContent}
                <label>Offers</label>
                <input type="text" name="offers" value={data.offers} placeholder="Offers" className="form-control" onChange={handleChange}></input>
                <label>Tags</label>
                <input type="text" name="tags" value={data.tags} placeholder="Tags" className="form-control" onChange={handleChange}></input>
                <label>Origin</label>
                <input type="text" name="origin" value={data.origin} placeholder="Origin" className="form-control" onChange={handleChange}></input>
                <input type="checkbox" checked={data.warrentyStatus} name="warrentyStatus" onChange={handleChange}></input>
                <label> &nbsp;Warrenty Status</label>
                <br />
                {
                    data.warrentyStatus && (
                        <>
                            <label>Warrenty Period</label>
                            <input type="text" value={data.warrentyPeriod} name="warrentyPeriod" placeholder="Warrenty Period" className="form-control" onChange={handleChange}></input>
                        </>
                    )
                }

                <input type="checkbox" checked={data.isReturnEligible} name="isReturnEligible" onChange={handleChange}></input>
                <label> &nbsp;Return Eligible</label>
                <br></br>
                <label>Choose Images</label>
                <input type="file" className="form-control" onChange={handleChange} accept="image/*"></input>
                {
                    filesToPreview.map((file, index) => (
                        <div style={{ marginTop: '10px' }} key={index} >
                            <img src={file} alt="preview.png" width="200px"></img>
                            <span onClick={() => removeImage('old', index, file)} title="Remove Image" style={{ marginLeft: '5px', color: 'red' }}>
                                <FaTrashAlt></FaTrashAlt>
                            </span>
                        </div>
                    ))
                }
                {
                    filesToUpload.map((file, index) => (
                        <div style={{ marginTop: '10px' }} key={index} >
                            <img src={URL.createObjectURL(file)} alt="preview.png" width="200px"></img>
                            <span onClick={() => removeImage('new', index)} title="Remove Image" style={{ marginLeft: '5px', color: 'red' }}>
                                <FaTrashAlt></FaTrashAlt>
                            </span>
                        </div>
                    ))
                }
                <hr />
                <SubmitButton
                    isSubmitting={isSubmitting}
                ></SubmitButton>
            </form>
        </>
    );
}

ProductForm.propTypes = {
    isEdit: PropTypes.bool,
    isSubmitting: PropTypes.bool,
    productData: PropTypes.object,
    submitCallback: PropTypes.func.isRequired
}
