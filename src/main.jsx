import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AppApolloProvider from './services/api/AppApolloProvider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppApolloProvider>
      <App />
    </AppApolloProvider>
  </React.StrictMode>
);
