// src/App.jsx

import React from 'react';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';


// ======================================================
// LOGIN
// ======================================================

import LoginPage from './pages/LoginPage';


// ======================================================
// DASHBOARD
// ======================================================

import DashboardPage from './components/Dashboard/DashboardPage';


// ======================================================
// MIEMBROS
// ======================================================

import MembersPage from './components/Members/MembersPage';
import BlacklistPage from './components/Members/BlacklistPage';
import InactiveMembersPage from './components/Members/InactiveMembersPage';

import RegisterMemberPage from './components/Members/Register/RegisterMemberPage';
import RegisterSubscriptionPage from './components/Members/Register/RegisterSubscriptionPage';
import RegisterQRPage from './components/Members/Register/RegisterQRPage';

import RegisterCouplePage from './components/Members/Register/RegisterCouplePage';
import RegisterCoupleSubscriptionPage from './components/Members/Register/RegisterCoupleSubscriptionPage';
import RegisterCoupleQRPage from './components/Members/Register/RegisterCoupleQRPage';

import MemberProfilePage from './components/Members/Profile/MemberProfilePage';
import EditMemberPage from './components/Members/Profile/EditMemberPage';
import RenewSubscriptionPage from './components/Members/Profile/RenewSubscriptionPage';


// ======================================================
// MÓDULOS PRINCIPALES
// ======================================================

import SubscriptionsPage from './components/Subscriptions/SubscriptionsPage';
import AccessControlPage from './components/Access/AccessControlPage';
import AttendancePage from './components/Attendance/AttendancePage';
import VisitsPage from './components/Visits/VisitsPage';
import PaymentsPage from './components/Payments/PaymentsPage';
import CashPage from './components/Cash/CashPage';
import ReportsPage from './components/Reports/ReportsPage';
import SettingsPage from './components/Settings/SettingsPage';


// ======================================================
// IMPORTACIÓN
// ======================================================

import ImportDataPage from './components/Import/ImportDataPage';


// ======================================================
// VENTAS
// ======================================================

import SalesPage from './components/Sales/SalesPage';
import ProductsPage from './components/Sales/ProductsPage';
import SalesHistoryPage from './components/Sales/SalesHistoryPage';


// ======================================================
// PROTECCIÓN SISTEMA GIMNASIO
// ======================================================

import ProtectedRoute from './components/Layout/ProtectedRoute';

import {
  getCurrentSession,
  getFirstAllowedRoute
} from './services/authService';


// ======================================================
// NEXGYM
// ======================================================

import NexgymAdminLayout from './nexgym/components/layout/NexgymAdminLayout';

import NexgymProtectedRoute from './nexgym/components/auth/NexgymProtectedRoute';

import NexgymLoginPage from './nexgym/pages/NexgymLoginPage';

import NexgymTestPage from './nexgym/pages/NexgymTestPage';
import NexgymDashboardPage from './nexgym/pages/NexgymDashboardPage';
import NexgymGymsPage from './nexgym/pages/NexgymGymsPage';
import NexgymGymDetailPage from './nexgym/pages/NexgymGymDetailPage';
import NexgymNewGymPage from './nexgym/pages/NexgymNewGymPage';

import NexgymSubscriptionsPage from './nexgym/pages/NexgymSubscriptionsPage';
import NexgymBillingPage from './nexgym/pages/NexgymBillingPage';

import NexgymSupportPage from './nexgym/pages/NexgymSupportPage';
import NexgymActivityPage from './nexgym/pages/NexgymActivityPage';
import NexgymSettingsPage from './nexgym/pages/NexgymSettingsPage';


// ======================================================
// ROOT
// ======================================================

const RootRedirect = () => {

  const session =
    getCurrentSession();


  return (

    <Navigate
      to={
        session
          ? getFirstAllowedRoute(
              session
            )
          : '/login'
      }
      replace
    />

  );

};


// ======================================================
// APP
// ======================================================

function App() {

  return (

    <Router>

      <Routes>


        {/* ================================================= */}
        {/* LOGIN GIMNASIO */}
        {/* ================================================= */}

        <Route
          path="/login"
          element={
            <LoginPage />
          }
        />


        {/* ================================================= */}
        {/* ROOT */}
        {/* ================================================= */}

        <Route
          path="/"
          element={
            <RootRedirect />
          }
        />


        {/* ================================================= */}
        {/* DASHBOARD */}
        {/* ================================================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute permission="dashboard">

              <DashboardPage />

            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* MIEMBROS */}
        {/* ================================================= */}

        <Route
          path="/members"
          element={
            <ProtectedRoute permission="members">

              <MembersPage />

            </ProtectedRoute>
          }
        />


        <Route
          path="/members/blacklist"
          element={
            <ProtectedRoute permission="members">

              <BlacklistPage />

            </ProtectedRoute>
          }
        />


        <Route
          path="/members/import"
          element={
            <ProtectedRoute permission="members">

              <ImportDataPage />

            </ProtectedRoute>
          }
        />


        <Route
          path="/members/register"
          element={
            <ProtectedRoute permission="members">

              <RegisterMemberPage />

            </ProtectedRoute>
          }
        />


        <Route
          path="/members/register/subscription"
          element={
            <ProtectedRoute permission="members">

              <RegisterSubscriptionPage />

            </ProtectedRoute>
          }
        />


        <Route
          path="/members/register/qr"
          element={
            <ProtectedRoute permission="members">

              <RegisterQRPage />

            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* PAREJAS */}
        {/* ================================================= */}

        <Route
          path="/members/register/couple"
          element={
            <ProtectedRoute permission="members">

              <RegisterCouplePage />

            </ProtectedRoute>
          }
        />


        <Route
          path="/members/register/couple/subscription"
          element={
            <ProtectedRoute permission="members">

              <RegisterCoupleSubscriptionPage />

            </ProtectedRoute>
          }
        />


        <Route
          path="/members/register/couple/access"
          element={
            <ProtectedRoute permission="members">

              <RegisterCoupleQRPage />

            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* PERFIL */}
        {/* ================================================= */}

        <Route
          path="/members/:id"
          element={
            <ProtectedRoute permission="members">

              <MemberProfilePage />

            </ProtectedRoute>
          }
        />


        <Route
          path="/members/:id/edit"
          element={
            <ProtectedRoute permission="members">

              <EditMemberPage />

            </ProtectedRoute>
          }
        />


        <Route
          path="/members/:id/renew"
          element={
            <ProtectedRoute permission="subscriptions">

              <RenewSubscriptionPage />

            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* SUSCRIPCIONES */}
        {/* ================================================= */}

        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute permission="subscriptions">

              <SubscriptionsPage />

            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* ACCESO */}
        {/* ================================================= */}

        <Route
          path="/access"
          element={
            <ProtectedRoute permission="access">

              <AccessControlPage />

            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* ASISTENCIAS */}
        {/* ================================================= */}

        <Route
          path="/attendance"
          element={
            <ProtectedRoute permission="attendance">

              <AttendancePage />

            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* RETENCIÓN */}
        {/* ================================================= */}

        <Route
          path="/retention"
          element={
            <ProtectedRoute permission="retention">

              <InactiveMembersPage />

            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* VISITAS */}
        {/* ================================================= */}

        <Route
          path="/visits"
          element={
            <ProtectedRoute permission="visits">

              <VisitsPage />

            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* VENTAS */}
        {/* ================================================= */}

        <Route
          path="/sales"
          element={
            <ProtectedRoute permission="sales">

              <SalesPage />

            </ProtectedRoute>
          }
        />


        <Route
          path="/sales/history"
          element={
            <ProtectedRoute permission="sales_history">

              <SalesHistoryPage />

            </ProtectedRoute>
          }
        />


        <Route
          path="/sales/products"
          element={
            <ProtectedRoute permission="products">

              <ProductsPage />

            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* PAGOS */}
        {/* ================================================= */}

        <Route
          path="/payments"
          element={
            <ProtectedRoute permission="payments">

              <PaymentsPage />

            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* CAJA */}
        {/* ================================================= */}

        <Route
          path="/cash"
          element={
            <ProtectedRoute permission="cash">

              <CashPage />

            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* REPORTES */}
        {/* ================================================= */}

        <Route
          path="/reports"
          element={
            <ProtectedRoute permission="reports">

              <ReportsPage />

            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* CONFIGURACIÓN */}
        {/* ================================================= */}

        <Route
          path="/settings"
          element={
            <ProtectedRoute permission="settings">

              <SettingsPage />

            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* LOGIN NEXGYM SUPER ADMIN */}
        {/* ================================================= */}

        <Route
          path="/nexgym/login"
          element={
            <NexgymLoginPage />
          }
        />


        {/* ================================================= */}
        {/* NEXGYM ADMIN PROTEGIDO */}
        {/* ================================================= */}

        <Route
          path="/nexgym"
          element={
            <NexgymProtectedRoute>

              <NexgymAdminLayout />

            </NexgymProtectedRoute>
          }
        >


          {/* ================================================= */}
          {/* INICIO */}
          {/* ================================================= */}

          <Route
            index
            element={
              <Navigate
                to="/nexgym/dashboard"
                replace
              />
            }
          />


          {/* ================================================= */}
          {/* DASHBOARD NEXGYM */}
          {/* ================================================= */}

          <Route
            path="dashboard"
            element={
              <NexgymDashboardPage />
            }
          />


          {/* ================================================= */}
          {/* GIMNASIOS */}
          {/* ================================================= */}

          <Route
            path="gyms"
            element={
              <NexgymGymsPage />
            }
          />


          <Route
            path="gyms/new"
            element={
              <NexgymNewGymPage />
            }
          />


          <Route
            path="gyms/:id"
            element={
              <NexgymGymDetailPage />
            }
          />


          {/* ================================================= */}
          {/* SUSCRIPCIONES NEXGYM */}
          {/* ================================================= */}

          <Route
            path="subscriptions"
            element={
              <NexgymSubscriptionsPage />
            }
          />


          {/* ================================================= */}
          {/* PAGOS NEXGYM */}
          {/* ================================================= */}

          <Route
            path="billing"
            element={
              <NexgymBillingPage />
            }
          />


          {/* ================================================= */}
          {/* SOPORTE NEXGYM */}
          {/* ================================================= */}

          <Route
            path="support"
            element={
              <NexgymSupportPage />
            }
          />


          {/* ================================================= */}
          {/* ACTIVIDAD NEXGYM */}
          {/* ================================================= */}

          <Route
            path="activity"
            element={
              <NexgymActivityPage />
            }
          />


          {/* ================================================= */}
          {/* CONFIGURACIÓN NEXGYM */}
          {/* ================================================= */}

          <Route
            path="settings"
            element={
              <NexgymSettingsPage />
            }
          />


          {/* ================================================= */}
          {/* TEST */}
          {/* ================================================= */}

          <Route
            path="test"
            element={
              <NexgymTestPage />
            }
          />


        </Route>


        {/* ================================================= */}
        {/* 404 */}
        {/* ================================================= */}

        <Route
          path="*"
          element={
            <RootRedirect />
          }
        />


      </Routes>

    </Router>

  );

}


export default App;