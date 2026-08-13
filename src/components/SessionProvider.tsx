"use client";

// Holds the current auth state for the whole app and keeps it live. It hydrates
// client-side on mount (getSession) and subscribes to onAuthStateChange, so the
// nav reflects login/logout immediately.
//
// Deliberately client-only: reading auth cookies in RootLayout would force
// every route to render dynamically and deopt the static pages (/breeds,
// /privacy, …). The cost is a brief logged-out flash in the nav before
// hydration — fine for a non-security display control. Anything that actually
// gates access (/account, /results, /admin) re-checks on the server.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface SessionValue {
  user: User | null;
  /** True until the first getSession() resolves — lets the nav avoid flicker. */
  loading: boolean;
}

const SessionContext = createContext<SessionValue>({
  user: null,
  loading: true,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

/** Current auth state. `loading` is true until the first session check resolves. */
export function useSession(): SessionValue {
  return useContext(SessionContext);
}
