import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Redirect based on user role
      const user = useAuthStore.getState().user;
      if (user.role === 'STUDENT') {
        navigate('/student');
      } else if (user.role === 'TUTOR') {
        navigate('/tutor');
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Sign in to continue your learning journey</p>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <div className="form-footer">
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">
          <span>Don't have an account?</span>
        </div>

        <Link to="/register" className="btn btn-outline btn-block">
          Create Account
        </Link>

        <div className="demo-credentials">
          <p><strong>Demo Accounts:</strong></p>
          <p>Student: student@educonnect.com / Student@123</p>
          <p>Tutor: tutor@educonnect.com / Tutor@123</p>
          <p>Admin: admin@educonnect.com / Admin@123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
