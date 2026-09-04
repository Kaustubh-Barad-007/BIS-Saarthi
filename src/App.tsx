import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Home from '@/pages/Home';
import DashboardRouter from '@/pages/DashboardRouter';
import AuthScreen from '@/pages/AuthScreen';
import { useAuth } from '@/app/providers/AuthContext';

function App() {
  const { role } = useAuth();

  return (
    <GoogleOAuthProvider clientId="80260312672-snig6qf4r1nu24petpqnu3m4bd9qnh2a.apps.googleusercontent.com">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* Auth Routes */}
          <Route path="/sign-in" element={role ? <Navigate to="/dashboard" replace /> : <AuthScreen type="login" />} />
          <Route path="/login" element={role ? <Navigate to="/dashboard" replace /> : <AuthScreen type="login" />} />
          <Route path="/sign-up" element={role ? <Navigate to="/dashboard" replace /> : <AuthScreen type="register" />} />
          <Route path="/register" element={role ? <Navigate to="/dashboard" replace /> : <AuthScreen type="register" />} />

          {/* Protected Routes */}
          <Route path="/dashboard/*" element={
            role ? <DashboardRouter /> : <Navigate to="/sign-in" replace />
          } />
          
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
