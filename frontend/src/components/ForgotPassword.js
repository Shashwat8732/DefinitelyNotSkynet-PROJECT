// src/components/ForgotPassword.js
import React, { useState } from 'react';
import { Mail, Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import authService from '../services/authService';

function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.forgotPassword(email);
      setSuccess(true);
      if (result.reset_token) {
        setResetToken(result.reset_token);
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-xl border border-green-500 border-opacity-30 rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
            <p className="text-gray-300 mb-6">
              We've sent a password reset link to <span className="text-cyan-400 font-semibold">{email}</span>
            </p>

            {resetToken && (
              <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-300 mb-2">
                  <strong>Development Mode:</strong> Copy this reset token:
                </p>
                <div className="bg-gray-900 rounded p-2 font-mono text-xs text-white break-all">
                  {resetToken}
                </div>
              </div>
            )}

            <p className="text-sm text-gray-400 mb-6">
              If you don't see the email, check your spam folder or try again.
            </p>

            <button
              onClick={onBackToLogin}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 transform rotate-3 shadow-2xl">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Forgot Password?
          </h1>
          <p className="text-gray-400">Enter your email to reset your password</p>
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-xl border border-cyan-500 border-opacity-30 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="your.email@example.com"
                  className="w-full bg-gray-700 bg-opacity-50 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-600"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </div>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <button
            onClick={onBackToLogin}
            className="w-full mt-4 flex items-center justify-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
