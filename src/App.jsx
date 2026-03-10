import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Eagerly loaded (critical path)
import SplashPage from './pages/SplashPage';
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

// Lazily loaded (heavy / less-visited pages)
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const PriceTrendsPage = React.lazy(() => import('./pages/PriceTrendsPage'));
const BoostPage = React.lazy(() => import('./pages/BoostPage'));

import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

import './index.css';
import './App.css';

function LazyFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
      <div className="spinner dark" style={{ margin: '0 auto' }} />
    </div>
  );
}

function AppRoutes() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg,#0f5228,#1a7a3c)' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🐄</div>
          <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: 28, fontWeight: 900 }}>PashuBazaar</div>
          <div style={{ marginTop: 20 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <Toaster position="top-center" />
        <Routes>
          <Route path="*" element={<SplashPage />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <Navbar />
      <div style={{ paddingBottom: 'var(--bottom-nav-h)' }}>
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/listing/:id" element={<ListingDetailPage />} />
            <Route path="/sell" element={<SellPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/boost" element={<BoostPage />} />
            <Route path="/price-trends" element={<PriceTrendsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-listings" element={<MyListingsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/admin" element={<AdminPage />} />
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
