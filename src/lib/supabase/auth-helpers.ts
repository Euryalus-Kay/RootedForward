"use client";
import { createClient } from "./client";

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
) {
  const supabase = createClient();
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
}

export async function signInWithGoogle() {
  const supabase = createClient();
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

export async function signOut() {
  const supabase = createClient();
  if (!supabase) return;
  return supabase.auth.signOut();
}
