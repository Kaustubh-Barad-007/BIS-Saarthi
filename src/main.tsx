import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './app/providers/AuthContext'
import { ThemeProvider } from './app/providers/ThemeContext'
import { LanguageProvider } from './app/providers/LanguageContext'
import App from './App'
import './index.css'

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
