import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import { TrialProvider } from './hooks/useTrialContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <TrialProvider>
          <App />
        </TrialProvider>
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
