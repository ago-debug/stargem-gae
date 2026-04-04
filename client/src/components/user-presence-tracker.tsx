import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export function UserPresenceTracker() {
  const { user } = useAuth();

  useEffect(() => {
    // Solo invia l'heartbeat se l'utente è loggato
    if (!user) return;

    const pingHeartbeat = async () => {
      try {
        await apiRequest("POST", "/api/users/presence/heartbeat");
      } catch (error) {
        console.error("Failed to ping presence heartbeat", error);
      }
    };

    // Ping immediato al caricamento
    pingHeartbeat();

    // Ping ogni minuto (60000 ms)
    const intervalId = setInterval(pingHeartbeat, 60000);

    return () => clearInterval(intervalId);
  }, [user]);

  return null; // Componente "silenzioso", non renderizza nulla
}
