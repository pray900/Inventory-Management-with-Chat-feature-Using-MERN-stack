import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/theme.scss';
import { App } from './components/app.component'

const root = createRoot(document.getElementById('root'));
root.render(<App></App>);
