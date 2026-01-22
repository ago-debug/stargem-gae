import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface ConfigResponse {
  isExternalDeploy: boolean;
  authType: string;
}

export function useAuth() {
  const { data: config } = useQuery<ConfigResponse>({
    queryKey: ["/api/config"],
    retry: false,
  });

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !config?.isExternalDeploy,
  });

  if (config?.isExternalDeploy) {
    return {
      user: { id: "external-user", email: "user@external", firstName: "External", lastName: "User" } as User,
      isLoading: false,
      isAuthenticated: true,
    };
  }

  return {
    user,
    isLoading: userLoading,
    isAuthenticated: !!user,
  };
}
