import { createElement, StrictMode as strictMode } from 'react';
import { createRoot } from 'react-dom/client';
import app from './App.jsx';

createRoot(document.getElementById('root')).render(
    createElement(strictMode, null, createElement(app))
);
