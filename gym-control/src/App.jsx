import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './components/Dashboard/DashboardPage';
import MembersPage from './components/Members/MembersPage';
import RegisterMemberPage from './components/Members/Register/RegisterMemberPage';
import RegisterSubscriptionPage from './components/Members/Register/RegisterSubscriptionPage';
import RegisterQRPage from './components/Members/Register/RegisterQRPage';
import MemberProfilePage from './components/Members/Profile/MemberProfilePage';
import EditMemberPage from './components/Members/Profile/EditMemberPage';
import RenewSubscriptionPage from './components/Members/Profile/RenewSubscriptionPage';
import SubscriptionsPage from './components/Subscriptions/SubscriptionsPage';
import AccessControlPage from './components/Access/AccessControlPage';
import AttendancePage from './components/Attendance/AttendancePage';
import PaymentsPage from './components/Payments/PaymentsPage';
import ReportsPage from './components/Reports/ReportsPage';
import SettingsPage from './components/Settings/SettingsPage';
import ProtectedRoute from './components/Layout/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          localStorage.getItem('isAuthenticated') === 'true' 
            ? <Navigate to="/dashboard" replace /> 
            : <Navigate to="/login" replace />
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/members" element={
          <ProtectedRoute>
            <MembersPage />
          </ProtectedRoute>
        } />
        
        <Route path="/members/register" element={
          <ProtectedRoute>
            <RegisterMemberPage />
          </ProtectedRoute>
        } />
        
        <Route path="/members/register/subscription" element={
          <ProtectedRoute>
            <RegisterSubscriptionPage />
          </ProtectedRoute>
        } />
        
        <Route path="/members/register/qr" element={
          <ProtectedRoute>
            <RegisterQRPage />
          </ProtectedRoute>
        } />
        
        <Route path="/members/:id" element={
          <ProtectedRoute>
            <MemberProfilePage />
          </ProtectedRoute>
        } />
        
        <Route path="/members/:id/edit" element={
          <ProtectedRoute>
            <EditMemberPage />
          </ProtectedRoute>
        } />
        
        <Route path="/members/:id/renew" element={
          <ProtectedRoute>
            <RenewSubscriptionPage />
          </ProtectedRoute>
        } />
        
        <Route path="/subscriptions" element={
          <ProtectedRoute>
            <SubscriptionsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/access" element={
          <ProtectedRoute>
            <AccessControlPage />
          </ProtectedRoute>
        } />
        
        <Route path="/attendance" element={
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        } />
        
        <Route path="/payments" element={
          <ProtectedRoute>
            <PaymentsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;