import { useQuery } from "@tanstack/react-query";

export type PresenceUser = {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  currentSessionStart: string | null;
  lastSeenAt: string | null;
};

export function useActiveUsers() {
  return useQuery<PresenceUser[]>({
    queryKey: ["/api/users/presence/active"],
    refetchInterval: 30000, // Effettua il polling ogni 30 secondi
  });
}
