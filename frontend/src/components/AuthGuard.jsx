import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

export default function AuthGuard({ children }) {
  const { isAuthenticated, isProfileComplete, isLoading, initAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    initAuth();
  }, []);

  // Show spinner while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Logged in but profile incomplete → redirect to setup (unless already there)
  if (!isProfileComplete && location.pathname !== '/profile/setup') {
    return <Navigate to="/profile/setup" replace />;
  }

  return children;
}
