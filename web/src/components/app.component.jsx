import React from 'react';
import { AppRouting } from './app.routing';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Provider } from 'react-redux'
import { store } from '../store';

export const App = () => (
  <div>
    <Provider store={store}>
      <AppRouting></AppRouting>
      <ToastContainer></ToastContainer>
    </Provider>
  </div>
)
