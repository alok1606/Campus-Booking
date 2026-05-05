import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const fillDemo = (role) => {
    const creds = { admin: { email: 'admin@campus.edu', password: 'Admin@123' }, faculty: { email: 'faculty@campus.edu', password: 'Faculty@123' }, student: { email: 'student@campus.edu', password: 'Student@123' } };
    setForm(creds[role]);
  };

  return (
    <div className="min-h-screen bg-ink-900 flex">
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 bg-ink-900">
        <h1 className="font-display text-5xl font-bold text-white leading-tight">Campus<br />Resource &<br />Event Hub</h1>
        <p className="mt-6 text-ink-400 text-lg leading-relaxed max-w-sm">Centralized booking and event management for your entire campus community.</p>
        <div className="mt-12 grid grid-cols-2 gap-4 max-w-xs">
          {[['Events', 'Draft to approval workflow'], ['Resources', 'Halls, labs & equipment'], ['Bookings', 'No-conflict scheduling'], ['Reports', 'Export & analytics']].map(([title, desc]) => (
            <div key={title} className="border border-ink-700 rounded-lg p-3">
              <p className="text-white font-medium text-sm">{title}</p>
              <p className="text-ink-500 text-xs mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-ink-50">
        <div className="w-full max-w-sm">
          <div className="card shadow-lg">
            <h2 className="font-display text-2xl font-semibold text-ink-900 mb-1">Sign in</h2>
            <p className="text-ink-500 text-sm mb-6">Welcome back to CampusBook</p>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@campus.edu" />
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
            <div className="mt-4">
              <p className="text-xs text-ink-400 mb-2">Quick demo access:</p>
              <div className="flex gap-2">
                {['admin', 'faculty', 'student'].map(r => (
                  <button key={r} onClick={() => fillDemo(r)} className="flex-1 text-xs border border-ink-200 rounded px-2 py-1 hover:bg-ink-100 capitalize font-mono transition-colors">{r}</button>
                ))}
              </div>
            </div>
            <p className="text-center text-sm text-ink-500 mt-5">No account? <Link to="/register" className="text-ink-900 font-medium hover:underline">Register</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
