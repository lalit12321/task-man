'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowUpRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard');
  }, [user, authLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
      toast.success('Welcome back');
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-ink-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-stripes opacity-30" />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-ink-300 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
        <div className="relative z-10">
          <p className="serial !text-accent-500 mb-6">Welcome back</p>
          <h2 className="font-display text-6xl leading-none mb-6">
            The work<br />
            <em className="text-ink-400">is waiting.</em>
          </h2>
          <p className="text-ink-400 max-w-md leading-relaxed">
            Sign in to your workspace. Your tasks, teams and assignments are where you left them.
          </p>
        </div>
        <div className="relative z-10 serial !text-ink-500">— Teamflow · Authentication</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-ink-500 hover:text-ink-900 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </div>
          <p className="serial mb-3">Sign in · 01</p>
          <h1 className="font-display text-5xl text-ink-950 mb-2">Hello again.</h1>
          <p className="text-ink-600 mb-10">Enter your details to access your workspace.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="••••••••"
                className="input"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full !py-3 text-sm">
              {submitting ? 'Signing in…' : 'Sign in'}
              {!submitting && <ArrowUpRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-10 text-sm text-ink-600">
            No account yet?{' '}
            <Link href="/signup" className="text-ink-950 font-medium underline underline-offset-4 decoration-accent-600 decoration-2">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
