import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './app/providers/AuthContext'
import { ThemeProvider } from './app/providers/ThemeContext'
import { LanguageProvider } from './app/providers/LanguageContext'
import App from './App'
import './index.css'

// When deployed to GitHub Pages (*.github.io), forward API calls to the live production server
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  const BACKEND_URL = 'https://bis-saarthi-sih.vercel.app';
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString());
    if (url.startsWith('/api/') && window.location.hostname.includes('github.io')) {
      url = BACKEND_URL + url;
      if (input instanceof Request) {
        return originalFetch(new Request(url, input), init);
      }
      return originalFetch(url, init);
    }
    return originalFetch(input, init);
  };
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
)
