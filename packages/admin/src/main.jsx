import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: '#6366f1',
                        borderRadius: 8,
                        fontFamily: 'Inter, system-ui, sans-serif',
                    },
                    algorithm: theme.defaultAlgorithm,
                }}
            >
                <App />
            </ConfigProvider>
        </BrowserRouter>
    </React.StrictMode>
);
