import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventForm from './pages/EventForm';
import Resources from './pages/Resources';
import BookingForm from './pages/BookingForm';
import Bookings from './pages/Bookings';
import Approvals from './pages/Approvals';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-ink-300 border-t-ink-800 rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="events" element={<Events />} />
            <Route path="events/new" element={<EventForm />} />
            <Route path="events/:id/edit" element={<EventForm />} />
            <Route path="resources" element={<Resources />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="bookings/new" element={<BookingForm />} />
            <Route path="approvals" element={<PrivateRoute roles={['admin', 'faculty']}><Approvals /></PrivateRoute>} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="reports" element={<PrivateRoute roles={['admin', 'faculty']}><Reports /></PrivateRoute>} />
            <Route path="audit" element={<PrivateRoute roles={['admin']}><AuditLogs /></PrivateRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
