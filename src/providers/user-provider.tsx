"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { TeamMember, AuthRole } from "@/lib/types";

interface UserContextType {
  currentUser: TeamMember | null;
  authRole: AuthRole | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  authRole: null,
  loading: true,
  refreshUser: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [authRole, setAuthRole] = useState<AuthRole | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        setCurrentUser(null);
        setAuthRole(null);
        return;
      }
      const data = await res.json();
      if (data?.user) {
        setCurrentUser(data.user);
        setAuthRole(data.user.auth_role);
      } else {
        setCurrentUser(null);
        setAuthRole(null);
      }
    } catch {
      setCurrentUser(null);
      setAuthRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <UserContext.Provider value={{ currentUser, authRole, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
