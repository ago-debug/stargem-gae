import { useQuery } from "@tanstack/react-query";

export type PresenceUser = {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  currentSessionStart: string | null;
  lastSessionDuration: number | null;
  lastSeenAt: string | null;
  role?: string | null;
  stato?: 'online' | 'pausa' | 'offline';
  lavoroOggiMinuti?: number;
  pausaOggiMinuti?: number;
  segmentoCorrenteInizio?: string | null;
  segmentoCorrenteTipo?: 'online' | 'pausa' | null;
};

export function useActiveUsers() {
  return useQuery<PresenceUser[]>({
    queryKey: ["/api/users/presence/active"],
    refetchInterval: 15000,
  });
}
