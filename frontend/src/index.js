import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Aplicacion from './Aplicacion';

const raiz = ReactDOM.createRoot(document.getElementById('root'));
raiz.render(
  <React.StrictMode>
    <Aplicacion />
  </React.StrictMode>
);