import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { LogIn, UserPlus, Fingerprint } from 'lucide-react';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_center,_#1a1a2a_0%,_#0a0a14_100%)]">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80')] opacity-5 bg-cover bg-center" />
      <div className="relative glass-card p-8 w-96">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="w-20 h-20 rounded-full glass-card flex items-center justify-center">
            <Fingerprint size={36} className="text-blue-400" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-white text-center mt-6 mb-6">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input"
            />
          </div>
          <div className="space-y-2">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
            />
          </div>
          <button
            type="submit"
            className="primary-button w-full py-2.5"
          >
            {isLogin ? (
              <>
                <LogIn size={18} /> Sign In
              </>
            ) : (
              <>
                <UserPlus size={18} /> Create Account
              </>
            )}
          </button>
        </form>
        <p className="mt-6 text-center text-white/70">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}