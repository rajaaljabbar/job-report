import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import ProfileSetupPage from './features/profile/ProfileSetupPage';
import HomePage from './features/dashboard/HomePage';
import ReportFormPage from './features/report/ReportFormPage';
import HistoryPage from './features/history/HistoryPage';
import NotFoundPage from './features/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes (with layout) */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/profile/setup" element={<ProfileSetupPage />} />
          <Route path="/profile/edit" element={<ProfileSetupPage />} />
          <Route path="/report/new" element={<ReportFormPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>

        {/* Redirects & Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
