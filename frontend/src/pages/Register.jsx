import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', department: '' });
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState(''); // ✅ NEW
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // ✅ EMAIL VALIDATION FUNCTION
  const checkEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@campus\.edu$/;

    if (!email) {
      setEmailError('');
      return;
    }

    if (!regex.test(email)) {
      setEmailError("Email must be in format: name@campus.edu");
    } else {
      setEmailError('');
    }
  };

  // ✅ PASSWORD VALIDATION FUNCTION
  const checkPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/;

    if (!password) {
      setPasswordError('');
      return;
    }

    if (!regex.test(password)) {
      setPasswordError(
        "Password must contain: 1 uppercase, 1 lowercase, 1 special character, minimum 6 characters"
      );
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ❌ STOP if any validation fails
    if (emailError || passwordError) {
      setError("Please fix all errors before submitting");
      return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="card shadow-lg">
          <h2 className="font-display text-2xl font-semibold text-ink-900 mb-1">Create account</h2>
          <p className="text-ink-500 text-sm mb-6">Join CampusBook to manage events & bookings</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">

              <div className="col-span-2">
                <label className="label">Full Name</label>
                <input
                  className="input"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div className="col-span-2">
                <label className="label">Email</label>
                <input
                  className={`input ${emailError ? 'border-red-500' : ''}`}
                  type="email"
                  required
                  value={form.email}
                  onChange={e => {
                    setForm({ ...form, email: e.target.value });
                    checkEmail(e.target.value); // ✅ LIVE VALIDATION
                  }}
                  placeholder="you@campus.edu"
                />

                {/* ✅ EMAIL ERROR */}
                {emailError && (
                  <p className="text-red-500 text-xs mt-1">
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  className={`input ${passwordError ? 'border-red-500' : ''}`}
                  type="password"
                  required
                  value={form.password}
                  onChange={e => {
                    setForm({ ...form, password: e.target.value });
                    checkPassword(e.target.value);
                  }}
                  placeholder="Enter strong password"
                />

                {passwordError && (
                  <p className="text-red-500 text-xs mt-1">
                    {passwordError}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Role</label>
                <select
                  className="input"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="label">Department</label>
                <input
                  className="input"
                  value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })}
                  placeholder="e.g. Computer Science"
                />
              </div>

            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-ink-900 font-medium hover:underline">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}