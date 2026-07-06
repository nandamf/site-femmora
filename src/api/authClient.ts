import type { AuthError, UserAttributes } from "@supabase/supabase-js";
import { requireSupabase } from "@/lib/supabase";

export type AuthResult = { success: true };

function appUrl(path: string) {
  return new URL(path, window.location.origin).toString();
}

function throwIfError(error: AuthError | null) {
  if (error) throw error;
}

export const authClient = {
  async register(email: string, password: string): Promise<AuthResult> {
    const { error } = await requireSupabase().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: appUrl("/") },
    });
    throwIfError(error);
    return { success: true };
  },

  async verifySignupOtp(email: string, token: string): Promise<AuthResult> {
    const { error } = await requireSupabase().auth.verifyOtp({
      email,
      token,
      type: "signup",
    });
    throwIfError(error);
    return { success: true };
  },

  async resendSignupOtp(email: string): Promise<AuthResult> {
    const { error } = await requireSupabase().auth.resend({ type: "signup", email });
    throwIfError(error);
    return { success: true };
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const { error } = await requireSupabase().auth.signInWithPassword({ email, password });
    throwIfError(error);
    return { success: true };
  },

  async loginWithGoogle(redirectPath = "/"): Promise<void> {
    const { error } = await requireSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: appUrl(redirectPath) },
    });
    throwIfError(error);
  },

  async logout(): Promise<AuthResult> {
    const { error } = await requireSupabase().auth.signOut();
    throwIfError(error);
    return { success: true };
  },

  async requestPasswordReset(email: string): Promise<AuthResult> {
    const { error } = await requireSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: appUrl("/reset-password"),
    });
    throwIfError(error);
    return { success: true };
  },

  async updatePassword(password: string): Promise<AuthResult> {
    const { error } = await requireSupabase().auth.updateUser({ password });
    throwIfError(error);
    return { success: true };
  },

  async updateProfile(attributes: UserAttributes): Promise<AuthResult> {
    const { error } = await requireSupabase().auth.updateUser(attributes);
    throwIfError(error);
    return { success: true };
  },
};
