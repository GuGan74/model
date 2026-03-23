import React, { Suspense } from 'react';
import {
  BrowserRouter, Routes, Route,
  Navigate, useLocation,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

import SplashPage from './pages/SplashPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import ListingDetailPage from './pages/ListingDetailPage';
import SearchPage from './pages/SearchPage';
import SellPage from './pages/SellPage';
import ProfilePage from './pages/ProfilePage';
import MyListingsPage from './pages/MyListingsPage';
import NotificationsPage from './pages/NotificationsPage';
import PaymentPage from './pages/PaymentPage';
import SuccessPage from './pages/SuccessPage';
import NotFoundPage from './pages/NotFoundPage';

const AdminPage = React.lazy(() => import('./pages/AdminPage'));
import SellerProfilePage from './pages/SellerProfilePage';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import loadingGif from './assets/379.gif';
import './index.css';
import './App.css';


function LazyFallback() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', minHeight: '40vh'
    }}>
      <img src={loadingGif} alt="Loading..." style={{ width: 60, height: 60, objectFit: 'contain' }} />
    </div>
  );
}

// Saves the URL the user wanted, then sends them to login
function LoginGuard({ children }) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) {
    sessionStorage.setItem(
      'pb_redirect_after_login',
      location.pathname + location.search
    );
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  const { isLoggedIn, isGuest, loading } = useAuth();
  // Sync fallback: read localStorage directly to avoid
  // the React async state update race condition
  const isGuestNow = isGuest ||
    localStorage.getItem('pb_guest') === 'true';

  // Loading splash
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        background: 'linear-gradient(135deg,#0f5228,#1a7a3c)',
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🐄</div>
          <div style={{
            fontFamily: 'Poppins,sans-serif',
            fontSize: 28, fontWeight: 900
          }}>
            Kosalai
          </div>
          <div style={{ marginTop: 20 }}>
            <img src={loadingGif} alt="Loading..." style={{ width: 80, height: 80, objectFit: 'contain' }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Neither logged in NOR guest → Onboarding ──────────
  if (!isLoggedIn && !isGuestNow) {
    return (
      <>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/login" element={<SplashPage />} />
          <Route path="*" element={<OnboardingPage />} />
        </Routes>
      </>
    );
  }

  // ── Guest OR logged-in → full app ─────────────────────
  return (
    <>
      <Toaster position="top-center" />
      <Navbar />
      <div style={{ paddingBottom: 'var(--bottom-nav-h)' }}>
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            {/* FREE — guests browse without login */}
            <Route path="/"
              element={<HomePage />} />
            <Route path="/search"
              element={<SearchPage />} />
            <Route path="/login"
              element={<SplashPage />} />

            {/* PROTECTED — login required */}
            <Route path="/listing/:id"
              element={
                <LoginGuard>
                  <ListingDetailPage />
                </LoginGuard>
              } />
            <Route path="/sell"
              element={
                <LoginGuard>
                  <SellPage />
                </LoginGuard>
              } />
            <Route path="/profile"
              element={
                <LoginGuard>
                  <ProfilePage />
                </LoginGuard>
              } />
            <Route path="/my-listings"
              element={
                <LoginGuard>
                  <MyListingsPage />
                </LoginGuard>
              } />
            <Route path="/notifications"
              element={
                <LoginGuard>
                  <NotificationsPage />
                </LoginGuard>
              } />
            <Route path="/payment"
              element={
                <LoginGuard>
                  <PaymentPage />
                </LoginGuard>
              } />
            <Route path="/success"
              element={
                <LoginGuard>
                  <SuccessPage />
                </LoginGuard>
              } />
            <Route path="/seller/:userId"
              element={<SellerProfilePage />} />
            <Route path="/admin"
              element={
                <LoginGuard>
                  <AdminPage />
                </LoginGuard>
              } />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
