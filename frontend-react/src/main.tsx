import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { CatalogProvider } from '@/contexts/CatalogContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { Toaster } from 'react-hot-toast';
import App from './App';
import '@/styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <FavoritesProvider>
              <App />
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 2500,
                  style: {
                    background: '#1a1a1a',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    borderRadius: '10px',
                    padding: '12px 20px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#16a34a',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </FavoritesProvider>
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
