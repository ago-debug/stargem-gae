import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface ConfigResponse {
  isExternalDeploy: boolean;
  authType: string;
}

export function useAuth() {
  const { data: config, isLoading: configLoading } = useQuery<ConfigResponse>({
    queryKey: ["/api/config"],
    retry: false,
  });

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: config !== undefined && !config.isExternalDeploy,
  });

  // Still loading config
  if (configLoading) {
    return {
      user: undefined,
      isLoading: true,
      isAuthenticated: false,
    };
  }

  // External deploy - bypass auth completely
  if (config?.isExternalDeploy) {
    return {
      user: { id: "external-user", email: "admin@studio", firstName: "Admin", lastName: "User" } as User,
      isLoading: false,
      isAuthenticated: true,
    };
  }

  // Normal Replit auth
  return {
    user,
    isLoading: userLoading,
    isAuthenticated: !!user,
  };
}
