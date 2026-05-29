import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { KeyRound, LogOut, Mail, UserPlus } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { AuthContext } from "../lib/auth";

type AuthGateProps = {
  children: ReactNode;
};

type AuthMode = "sign-in" | "sign-up";

export function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(isSupabaseConfigured);
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setIsLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoadingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <AuthContext.Provider value={{ isSupabaseConfigured: false, session: null }}>
        <div className="auth-dev-banner" role="status">
          Supabase is not configured yet. Local demo mode is active.
        </div>
        {children}
      </AuthContext.Provider>
    );
  }

  if (isLoadingSession) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Homelog</p>
          <h1>Checking your session.</h1>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="auth-shell">
        <section className="auth-card" aria-label="Authentication">
          <div>
            <p className="eyebrow">Homelog</p>
            <h1>{authMode === "sign-in" ? "Sign in to your home log." : "Create your home log."}</h1>
            <p>
              Keep project plans, contractor quotes, receipts, warranties, and completed work
              connected to your household.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authMode === "sign-up" ? (
              <label className="field">
                <span>Name</span>
                <input
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Jane Homeowner"
                />
              </label>
            ) : null}

            <label className="field">
              <span>Email</span>
              <input
                autoComplete="email"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                autoComplete={authMode === "sign-in" ? "current-password" : "new-password"}
                minLength={6}
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
              />
            </label>

            {error ? <p className="auth-error">{error}</p> : null}
            {message ? <p className="auth-message">{message}</p> : null}

            <button className="primary-button" disabled={isSubmitting} type="submit">
              {authMode === "sign-in" ? (
                <Mail size={18} aria-hidden="true" />
              ) : (
                <UserPlus size={18} aria-hidden="true" />
              )}
              {isSubmitting
                ? "Working..."
                : authMode === "sign-in"
                  ? "Sign in"
                  : "Create account"}
            </button>

            <button className="secondary-button" type="button" onClick={toggleAuthMode}>
              <KeyRound size={18} aria-hidden="true" />
              {authMode === "sign-in" ? "Need an account?" : "Already have an account?"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <AuthContext.Provider value={{ isSupabaseConfigured: true, session }}>
      <div className="auth-user-bar">
        <span>{session.user.email}</span>
        <button className="secondary-button compact-button" type="button" onClick={signOut}>
          <LogOut size={17} aria-hidden="true" />
          Sign out
        </button>
      </div>
      {children}
    </AuthContext.Provider>
  );

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    const credentials = {
      email,
      password,
    };

    const { error: authError } =
      authMode === "sign-in"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp({
            ...credentials,
            options: {
              data: {
                full_name: fullName.trim() || null,
              },
            },
          });

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (authMode === "sign-up") {
      setMessage("Account created. Check your email if confirmation is enabled.");
    }
  }

  function toggleAuthMode() {
    setAuthMode((currentMode) => (currentMode === "sign-in" ? "sign-up" : "sign-in"));
    setError("");
    setMessage("");
  }

  async function signOut() {
    await supabase?.auth.signOut();
  }
}
