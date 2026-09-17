import React, { useState, useEffect } from 'react';
import { SubmitButton } from './../../Common/SubmitButton/SubmitButton.component'
import { httpClient } from './../../../utils/httpClient'
import { notify } from './../../../utils/notify'
import { ErrorHandler } from './../../../utils/error.handler';
import { ViewProducts } from './../ViewProducts/ViewProducts.component';

const defaultForm = {
    category: '',
    name: '',
    minPrice: '',
    maxPrice: '',
    fromDate: '',
    toDate: '',
    tags: '',
    multipleDateRange: '',
    brand: '',
    color: ''
}

export const SearchProduct = () => {
    const [data, setData] = useState({ ...defaultForm });
    const [allProducts, setAllProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [names, setNames] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        setIsCategoryLoading(true)
        httpClient.POST('/product/search', {})
            .then(response => {
                const cats = [];
                (response.data || []).forEach(item => {
                    if (cats.indexOf(item.category) === -1) {
                        cats.push(item.category)
                    }
                })
                setCategories(cats)
                setAllProducts(response.data)
            })
            .catch(err => {
                ErrorHandler(err);
            }).finally(() => {
                setIsCategoryLoading(false)
            })
    }, [])

    const populateNames = (selectedCategory) => {
        setNames(allProducts.filter(item => item.category === selectedCategory))
    }

    const handleChange = e => {
        let { name, value, type, checked } = e.target;
        if (name === 'category') {
            populateNames(value)
        }
        if (type === 'checkbox') {
            value = checked
        }
        setData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = e => {
        e.preventDefault();
        setIsSubmitting(true)
        const payload = { ...data };
        if (!payload.multipleDateRange) {
            payload.toDate = payload.fromDate
        }
        httpClient.POST('/product/search', payload)
            .then(response => {
                if (!response.data.length) {
                    return notify.showInfo("No any products matched your search query!")
                }
                setSearchResults(response.data)
            })
            .catch(err => {
                ErrorHandler(err)
            }).finally(() => {
                setIsSubmitting(false)
            })
    }

    const reset = () => {
        setSearchResults([])
        setData({ ...defaultForm })
    }

    if (searchResults.length > 0) {
        return <ViewProducts productData={searchResults} resetSearch={reset}></ViewProducts>
    }

    return (
        <>
            <h2>Search Product</h2>
            <form className="form-group" onSubmit={handleSubmit} noValidate>
                <label>Category</label>
                <select name="category" className="form-control" onChange={handleChange}>
                    <option>(Select Category)</option>
                    {
                        categories.map((cat, index) => (
                            <option key={index} value={cat}>{cat}</option>
                        ))
                    }
                </select>
                {
                    data.category && names.length > 0 && (
                        <>
                            <label>Name</label>
                            <select name="name" className="form-control" onChange={handleChange}>
                                <option>(Select Name)</option>
                                {
                                    names.map((item, index) => (
                                        <option key={index} value={item.name}>{item.name}</option>
                                    ))
                                }
                            </select>
                        </>
                    )
                }

                <label>Min Price</label>
                <input type="number" name="minPrice" className="form-control" onChange={handleChange}></input>
                <label>Max Price</label>
                <input type="number" name="maxPrice" className="form-control" onChange={handleChange}></input>
                <label>Color</label>
                <input type="text" name="color" className="form-control" onChange={handleChange}></input>
                <label>Brand</label>
                <input type="text" name="brand" className="form-control" onChange={handleChange}></input>
                <label>Select Date</label>
                <input type="date" name="fromDate" className="form-control" onChange={handleChange}></input>
                <input type="checkbox" name="multipleDateRange" onChange={handleChange}></input>
                <label>&nbsp;Multiple Date Range</label>
                <br />
                {
                    data.multipleDateRange && (
                        <>
                            <label>To Date</label>
                            <input type="date" name="toDate" className="form-control" onChange={handleChange}></input>
                        </>
                    )
                }
                <label>Tags</label>
                <input type="text" name="tags" className="form-control" placeholder="Tags" onChange={handleChange}></input>

                <hr></hr>
                <SubmitButton
                    isSubmitting={isSubmitting}
                    enabledLabel="Search"
                    disabledLabel="Searching..."
                ></SubmitButton>
            </form>
        </>
    );
}
