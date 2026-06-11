"use client";

import { useState } from "react";
import Link from "next/link";
import {
  signUpWithEmail,
  signInWithGoogle,
} from "@/lib/supabase/auth-helpers";
import { Reveal } from "@/components/motion/Reveal";
import toast from "react-hot-toast";

const INPUT_CLASS =
  "w-full rounded-md border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30";

const LABEL_CLASS = "mb-1.5 block font-body text-sm font-medium text-ink";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await signUpWithEmail(
        email,
        password,
        fullName
      );

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSuccess(true);
      toast.success("Account created! Check your email.");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);

    try {
      const { error: oauthError } = await signInWithGoogle();

      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
      }
      // If successful, the page will redirect to Google OAuth
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setGoogleLoading(false);
    }
  }

  if (success) {
    return (
      <div className="grain grid-lines relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
        <Reveal y={20} className="relative z-10 w-full max-w-md">
          <div className="border border-border bg-white/40 px-6 py-10 text-center sm:px-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border border-forest/20 bg-forest/5">
              <svg
                className="h-7 w-7 text-forest"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="font-display text-3xl text-forest">
              Check your email
            </h2>
            <p className="mt-4 font-body text-sm leading-relaxed text-ink/70">
              We&apos;ve sent a confirmation link to{" "}
              <span className="font-medium text-ink">{email}</span>. Click the
              link in your email to activate your account.
            </p>
            <div className="mt-8 border-t border-border pt-6">
              <Link
                href="/auth/login"
                className="group font-body text-sm font-medium text-forest"
              >
                Back to sign in <span className="arrow-nudge">&rarr;</span>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="grain grid-lines relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      <Reveal y={20} className="relative z-10 w-full max-w-md">
        <div className="border border-border bg-white/40 px-6 py-10 sm:px-10">
          {/* Header */}
          <div className="mb-8">
            <p className="ledger text-warm-gray">Rooted Forward / Account</p>
            <h1 className="mt-3 font-display text-3xl text-forest md:text-4xl">
              Join Rooted Forward
            </h1>
            <p className="mt-3 font-body text-sm leading-relaxed text-ink/70">
              Create an account to save stops, leave comments, and more.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 border border-rust/40 bg-rust/5 px-4 py-3">
              <p className="font-body text-sm text-rust-dark">{error}</p>
            </div>
          )}

          {/* Sign up form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className={LABEL_CLASS}>
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="email" className={LABEL_CLASS}>
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="password" className={LABEL_CLASS}>
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className={LABEL_CLASS}>
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className={INPUT_CLASS}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <svg
                  className="h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="ledger text-warm-gray">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-sm border border-forest/30 px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-ink transition-colors hover:bg-forest/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {googleLoading ? (
              <svg
                className="h-5 w-5 animate-spin text-ink"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign up with Google
              </>
            )}
          </button>

          {/* Link to login */}
          <div className="mt-8 border-t border-border pt-6 text-center">
            <p className="font-body text-sm text-warm-gray">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="link-draw font-medium text-forest"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
