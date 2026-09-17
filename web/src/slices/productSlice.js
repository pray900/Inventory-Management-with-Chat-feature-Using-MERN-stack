import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { httpClient } from '../utils/httpClient';
import { ErrorHandler } from '../utils/error.handler';
import { notify } from '../utils/notify';

const initialState = {
    isLoading: false,
    isProductLoading: false,
    isReviewSubmitting: false,
    product: {},
    products: [],
    page: 1,
    pages: 1,
    total: 0
}

export const fetchProducts_ac = createAsyncThunk('product/fetchProducts', async (page = 1, { rejectWithValue }) => {
    try {
        const response = await httpClient.GET('/product', true, { page, limit: 10 })
        return response.data;
    } catch (err) {
        ErrorHandler(err)
        return rejectWithValue(err)
    }
})

export const removeProduct_ac = createAsyncThunk('product/removeProduct', async (id, { rejectWithValue }) => {
    try {
        await httpClient.DELETE(`/product/${id}`, true)
    } catch (err) {
        ErrorHandler(err)
        return rejectWithValue(err)
    }
    notify.showInfo("Product Removed")
    return id;
})

export const fetchProduct_ac = createAsyncThunk('product/fetchProduct', async ({ id, showLoader = true }, { rejectWithValue }) => {
    try {
        const response = await httpClient.GET(`/product/${id}`, true)
        return response.data;
    } catch (err) {
        ErrorHandler(err)
        return rejectWithValue(err)
    }
})

export const addReview_ac = createAsyncThunk('product/addReview', async ({ reviewData, productId }, { dispatch, rejectWithValue }) => {
    try {
        await httpClient.POST(`/product/add_review/${productId}`, reviewData, true)
        dispatch(fetchProduct_ac({ id: productId, showLoader: false }))
    } catch (err) {
        ErrorHandler(err)
        return rejectWithValue(err)
    }
})

const productSlice = createSlice({
    name: 'product',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts_ac.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchProducts_ac.fulfilled, (state, action) => {
                state.isLoading = false;
                state.products = action.payload.data;
                state.total = action.payload.total;
                state.page = action.payload.page;
                state.pages = action.payload.pages;
            })
            .addCase(fetchProducts_ac.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(removeProduct_ac.fulfilled, (state, action) => {
                state.products = state.products.filter(item => item._id !== action.payload);
            })
            .addCase(fetchProduct_ac.pending, (state, action) => {
                if (action.meta.arg.showLoader !== false) {
                    state.isProductLoading = true;
                }
            })
            .addCase(fetchProduct_ac.fulfilled, (state, action) => {
                state.isProductLoading = false;
                state.product = action.payload;
            })
            .addCase(fetchProduct_ac.rejected, (state) => {
                state.isProductLoading = false;
            })
            .addCase(addReview_ac.pending, (state) => {
                state.isReviewSubmitting = true;
            })
            .addCase(addReview_ac.fulfilled, (state) => {
                state.isReviewSubmitting = false;
            })
            .addCase(addReview_ac.rejected, (state) => {
                state.isReviewSubmitting = false;
            })
    }
})

export const productReducer = productSlice.reducer;
