'use client';

import React, { useState } from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { Icon } from '@/components/icons/Icons';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export function AuthModal() {
  const {
    authModalOpen,
    closeAuthModal,
    user,
    userProfile,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    toast,
  } = useBrunch();

  const [mode, setMode] = useState<'signin' | 'signup' | 'status'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please fill in both email and password.');
      return;
    }
    setLoading(true);
    setAuthError(null);
    try {
      const res = await signInWithEmail(email, password);
      if (res.error) {
        setAuthError(res.error);
      } else {
        toast('Signed in successfully');
        closeAuthModal();
      }
    } catch {
      setAuthError('An unexpected error occurred while signing in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setAuthError('Please provide your name, email, and a password.');
      return;
    }
    setLoading(true);
    setAuthError(null);
    try {
      const res = await signUpWithEmail(email, password, name, handle);
      if (res.error) {
        setAuthError(res.error);
      } else {
        toast('Account created! Check your email to confirm if required.');
        closeAuthModal();
      }
    } catch {
      setAuthError('An unexpected error occurred while creating your account.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await signInWithOAuth(provider);
      if (res.error) {
        setAuthError(res.error);
      }
    } catch {
      setAuthError(`Failed to authenticate with ${provider}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={closeAuthModal}
    >
      <div
        className="w-full max-w-md bg-[#13151b] border border-white/10 rounded-2xl p-6 shadow-2xl relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Close auth dialog"
        >
          <Icon name="x" className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-accent text-black flex items-center justify-center font-black text-sm">
            B
          </div>
          <h2 id="auth-modal-title" className="text-xl font-bold font-heading text-white">
            {user ? 'Account Settings' : 'Join Brunch'}
          </h2>
        </div>

        {user ? (
          /* User is already logged in */
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/40 text-accent flex items-center justify-center font-bold text-lg">
                {userProfile?.name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-white text-base truncate">
                  {userProfile?.name || 'Maker'}
                </div>
                <div className="text-xs text-white/50 truncate">
                  {user.email}
                </div>
                {userProfile?.handle && (
                  <div className="text-xs text-accent mt-0.5">
                    @{userProfile.handle}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Connected to Supabase PostgreSQL database
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  closeAuthModal();
                }}
                className="w-full py-2.5 rounded-xl font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* User is NOT logged in */
          <div>
            {/* Tabs */}
            <div className="flex border-b border-white/10 mb-5">
              <button
                onClick={() => { setMode('signin'); setAuthError(null); }}
                className={`flex-1 pb-2.5 text-sm font-semibold transition-all border-b-2 ${
                  mode === 'signin' ? 'border-accent text-accent' : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('signup'); setAuthError(null); }}
                className={`flex-1 pb-2.5 text-sm font-semibold transition-all border-b-2 ${
                  mode === 'signup' ? 'border-accent text-accent' : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                Create Account
              </button>
              <button
                onClick={() => { setMode('status'); setAuthError(null); }}
                className={`pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 flex items-center gap-1.5 ${
                  mode === 'status' ? 'border-accent text-accent' : 'border-transparent text-white/40 hover:text-white'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                Status
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {authError}
              </div>
            )}

            {mode === 'status' ? (
              /* Database Status tab */
              <div className="space-y-4 text-sm text-white/70">
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                  <div className="flex items-center gap-2 font-semibold text-white mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {isConfigured ? 'Supabase Backend Connected' : 'Local Persistence Mode Active'}
                  </div>
                  <p className="text-xs text-white/50">
                    {isConfigured
                      ? 'Live real-time queries and multi-user authentication are fully active.'
                      : 'Running in offline localStorage mode. All actions work locally in your browser.'}
                  </p>
                </div>

                {!isConfigured && (
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-white">To connect your live PostgreSQL database:</p>
                    <ol className="list-decimal list-inside space-y-1 text-white/60 pl-1">
                      <li>Create a free project at <span className="text-accent underline">supabase.com</span></li>
                      <li>Run <code className="bg-white/10 px-1 py-0.5 rounded">supabase/schema.sql</code> in SQL Editor</li>
                      <li>Copy URL and Anon Key into <code className="bg-white/10 px-1 py-0.5 rounded">.env.local</code></li>
                    </ol>

                    <button
                      type="button"
                      onClick={() => {
                        const template = `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`;
                        navigator.clipboard.writeText(template);
                        toast('Copied .env template to clipboard');
                      }}
                      className="mt-2 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Icon name="copy" className="w-3.5 h-3.5" />
                      Copy .env Template
                    </button>
                  </div>
                )}
              </div>
            ) : mode === 'signin' ? (
              /* Sign In Form */
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl font-bold bg-accent hover:brightness-110 text-black text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                  <span className="relative px-2 bg-[#13151b] text-white/40 text-xs">or continue with</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOAuth('github')}
                    className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Icon name="rocket" className="w-4 h-4" />
                    GitHub
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuth('google')}
                    className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Icon name="globe" className="w-4 h-4" />
                    Google
                  </button>
                </div>
              </form>
            ) : (
              /* Sign Up Form */
              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Chen"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Username / Handle</label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="alex_dev"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 rounded-xl font-bold bg-accent hover:brightness-110 text-black text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
