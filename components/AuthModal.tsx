import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { authService, User } from '../services/authService';
import { Mail, Lock, User as UserIcon, AlertCircle, CheckCircle, Heart, ArrowLeft, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialMode?: 'login' | 'signup';
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [mockOtp, setMockOtp] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Reset state when opening
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setSuccessMsg('');
      setMockOtp(null);
      setName('');
      setEmail('');
      setPassword('');
      setOtp('');
      setNewPassword('');
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name || !email || !password) throw new Error("All fields are required");
        const user = await authService.register(name, email, password);
        onLoginSuccess(user);
        onClose();
      } else if (mode === 'login') {
        if (!email || !password) throw new Error("All fields are required");
        const user = await authService.login(email, password);
        onLoginSuccess(user);
        onClose();
      } else if (mode === 'forgot') {
        if (!email) throw new Error("Please enter your email");
        const sentOtp = await authService.requestPasswordReset(email);
        setMockOtp(sentOtp); // For demo purposes only
        setMode('reset');
      } else if (mode === 'reset') {
        if (!otp || !newPassword) throw new Error("All fields are required");
        await authService.resetPassword(email, otp, newPassword);
        setSuccessMsg("Password reset successfully! Please login.");
        setMode('login');
        setMockOtp(null);
        setPassword(''); // Clear old password input if any
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'signup': return 'Create Account';
      case 'forgot': return 'Reset Password';
      case 'reset': return 'Verify OTP';
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={getTitle()}
    >
      <div className="p-6">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-2">
            {mode === 'forgot' || mode === 'reset' ? (
              <KeyRound className="w-8 h-8 text-primary-400" />
            ) : (
              <Heart className="w-8 h-8 text-primary-400 fill-current" />
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-600 animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2 text-sm text-green-600 animate-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Mock OTP Notification for Demo */}
        {mockOtp && mode === 'reset' && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
            <p className="font-bold text-xs uppercase tracking-wide mb-1 text-blue-600">Demo Mode</p>
            <p>Your OTP code is: <span className="font-mono font-bold text-lg mx-1">{mockOtp}</span></p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100/50 outline-none transition-all font-medium"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'forgot' || mode === 'reset') && (
            <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100/50 outline-none transition-all font-medium"
                  placeholder="you@example.com"
                  readOnly={mode === 'reset'}
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">Password</label>
                {mode === 'login' && (
                  <button 
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-xs font-semibold text-primary-500 hover:text-primary-600"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100/50 outline-none transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
                <label className="text-sm font-medium text-slate-700">One-Time Password (OTP)</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100/50 outline-none transition-all font-medium tracking-widest"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
              </div>
              <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
                <label className="text-sm font-medium text-slate-700">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100/50 outline-none transition-all font-medium"
                    placeholder="New secure password"
                  />
                </div>
              </div>
            </>
          )}

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full mt-4 shadow-xl shadow-primary-500/20" 
            isLoading={loading}
            size="lg"
          >
            {mode === 'login' && 'Log In'}
            {mode === 'signup' && 'Create Free Account'}
            {mode === 'forgot' && 'Send OTP'}
            {mode === 'reset' && 'Reset Password'}
          </Button>

          {mode === 'forgot' && (
             <Button 
              type="button" 
              variant="ghost" 
              className="w-full" 
              onClick={() => { setMode('login'); setError(''); }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </Button>
          )}
        </form>

        {(mode === 'login' || mode === 'signup') && (
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                className="font-bold text-primary-500 hover:text-primary-600 hover:underline"
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        )}
      </div>
      
      <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
        <p className="text-xs text-slate-400">
          By continuing, you agree to LAK PDF's Terms of Service and Privacy Policy.
        </p>
      </div>
    </Modal>
  );
};