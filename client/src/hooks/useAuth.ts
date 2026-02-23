import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { useEffect } from "react";

export function useAuth() {
  const { data: user, isLoading, isError } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const isAuthenticated = !!user;

  useEffect(() => {
    // Auto-redirect to login only if we are trying to access a protected route
    // (i.e., not root, not login page)
    const isPublicRoute = window.location.pathname === "/" || window.location.pathname.startsWith("/api/login");

    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      window.location.href = "/api/login"; // Or redirect to "/" to show landing page
    }
  }, [isLoading, isAuthenticated]);

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
