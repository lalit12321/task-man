'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { TeamRole } from '@/lib/types';
import { ArrowUpRight, ArrowLeft, ShieldCheck, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading, signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<TeamRole>('member');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard');
  }, [user, authLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signUp(email, password, displayName, role);
      toast.success('Workspace created');
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-accent-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-stripes opacity-20" />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-accent-100 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
        <div className="relative z-10">
          <p className="serial !text-accent-100 mb-6">A new workspace</p>
          <h2 className="font-display text-6xl leading-none mb-6">
            One account.<br />
            <em>Unlimited teams.</em>
          </h2>
          <p className="text-accent-100 max-w-md leading-relaxed">
            Sign up takes thirty seconds. After that, create your first team and share the invite code.
          </p>
        </div>
        <div className="relative z-10 serial !text-accent-200">— Teamflow · Registration</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-ink-500 hover:text-ink-900 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </div>
          <p className="serial mb-3">New account · 02</p>
          <h1 className="font-display text-5xl text-ink-950 mb-2">Begin.</h1>
          <p className="text-ink-600 mb-10">Choose your role and create your account.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`btn-secondary justify-start ${role === 'admin' ? '!border-ink-950 !bg-ink-950 !text-white' : ''}`}
                >
                  <ShieldCheck className="w-4 h-4" /> Admin
                </button>
                <button
                  type="button"
                  onClick={() => setRole('member')}
                  className={`btn-secondary justify-start ${role === 'member' ? '!border-ink-950 !bg-ink-950 !text-white' : ''}`}
                >
                  <UserRound className="w-4 h-4" /> Member
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="name" className="label">Your name</label>
              <input
                id="name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Animesh Sharma"
                className="input"
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="input"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="input"
                autoComplete="new-password"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full !py-3 text-sm">
              {submitting ? 'Creating account…' : 'Create account'}
              {!submitting && <ArrowUpRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-10 text-sm text-ink-600">
            Already have an account?{' '}
            <Link href="/login" className="text-ink-950 font-medium underline underline-offset-4 decoration-accent-600 decoration-2">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
