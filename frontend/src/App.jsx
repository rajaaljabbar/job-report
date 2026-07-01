import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import AuthGuard from './components/AuthGuard';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import ProfileSetupPage from './features/profile/ProfileSetupPage';
import HomePage from './features/dashboard/HomePage';
import ReportFormPage from './features/report/ReportFormPage';
import HistoryPage from './features/history/HistoryPage';
import PlannerPage from './features/planner/PlannerPage';
import GuestViewPage from './features/guest/GuestViewPage';
import NotFoundPage from './features/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes (no auth needed) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/guest/:username" element={<GuestViewPage />} />

        {/* Protected Routes (must be logged in) */}
        <Route
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/profile/setup" element={<ProfileSetupPage />} />
          <Route path="/profile/edit" element={<ProfileSetupPage />} />
          <Route path="/report/new" element={<ReportFormPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/planner" element={<PlannerPage />} />
        </Route>

        {/* Redirects & Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
