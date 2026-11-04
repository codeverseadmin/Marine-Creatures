'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function InvitationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<{
    name: string;
    email: string;
    roleName: string;
  } | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided. Please use the link provided in your invitation.');
      setLoading(false);
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/auth/invitation/verify?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to verify invitation link.');
        } else {
          setEmployee(data.employee);
        }
      } catch (err) {
        setError('Network error while verifying invitation. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/invitation/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Failed to activate account.');
        setSubmitting(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin');
        }, 1500);
      }
    } catch {
      setSubmitError('Network error while activating account. Please try again.');
      setSubmitting(false);
    }
  };

  // 1. Verifying State
  if (loading) {
    return (
      <div className="flex items-center gap-3 p-6 rounded-2xl bg-[#0b121a] border border-slate-800 shadow-xl font-mono text-xs text-slate-300">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>Verifying invitation credentials...</span>
      </div>
    );
  }

  // 2. Error State (Invalid / Expired)
  if (error || !employee) {
    return (
      <div className="w-full max-w-md bg-[#0b121a] border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 text-xl font-bold">
          ✕
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Invitation Invalid or Expired</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{error}</p>
        </div>
        <div className="pt-2">
          <Link
            href="/admin"
            className="w-full min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center transition-colors"
          >
            Return to Admin Sign In
          </Link>
        </div>
      </div>
    );
  }

  // 3. Success State
  if (success) {
    return (
      <div className="w-full max-w-md bg-[#0b121a] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl font-bold">
          ✓
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Welcome, {employee.name}!</h2>
          <p className="text-xs text-slate-400 mt-2">
            Your account has been activated. Redirecting to Control OS...
          </p>
        </div>
      </div>
    );
  }

  // 4. Form State (Set Password)
  const hasMinLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumberOrSymbol = /[0-9\W]/.test(password);

  return (
    <div className="w-full max-w-md bg-[#0b121a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
            OS
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 px-2.5 py-1 rounded-md bg-cyan-400/10 border border-cyan-400/20">
            {employee.roleName}
          </span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Accept Your Invitation</h1>
          <p className="text-xs text-slate-400 mt-1">
            Setting up identity for <span className="text-white font-medium">{employee.name}</span> (
            <span className="text-cyan-300 font-mono">{employee.email}</span>)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2">
            Create Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 pr-14 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors font-mono"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-xs text-slate-400 hover:text-white"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2">
            Confirm Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors font-mono"
            required
          />
        </div>

        {/* Password Strength Checklist */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-[11px] font-mono">
          <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-400' : 'text-slate-400'}`}>
            <span>{hasMinLength ? '✓' : '○'}</span>
            <span>At least 8 characters</span>
          </div>
          <div className={`flex items-center gap-2 ${hasLower ? 'text-emerald-400' : 'text-slate-400'}`}>
            <span>{hasLower ? '✓' : '○'}</span>
            <span>Contains a lowercase letter</span>
          </div>
          <div className={`flex items-center gap-2 ${hasUpper ? 'text-emerald-400' : 'text-slate-400'}`}>
            <span>{hasUpper ? '✓' : '○'}</span>
            <span>Contains an uppercase letter</span>
          </div>
          <div className={`flex items-center gap-2 ${hasNumberOrSymbol ? 'text-emerald-400' : 'text-slate-400'}`}>
            <span>{hasNumberOrSymbol ? '✓' : '○'}</span>
            <span>Contains a number or symbol</span>
          </div>
        </div>

        {submitError && (
          <p className="text-xs text-red-400 font-medium flex items-center gap-1.5" role="alert">
            <span>✕</span>
            <span>{submitError}</span>
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !hasMinLength || !hasLower || !hasUpper || !hasNumberOrSymbol}
          className="w-full min-h-[44px] h-12 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? 'Activating Account...' : 'Set Password & Access Control OS'}
        </button>
      </form>
    </div>
  );
}

export default function AdminInvitePage() {
  return (
    <main className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col justify-center items-center px-4 py-8 font-sans selection:bg-cyan-400 selection:text-black">
      <Suspense
        fallback={
          <div className="flex items-center gap-3 p-6 rounded-2xl bg-[#0b121a] border border-slate-800 shadow-xl font-mono text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Loading invitation...</span>
          </div>
        }
      >
        <InvitationForm />
      </Suspense>
    </main>
  );
}

