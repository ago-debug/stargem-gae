import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export function UserPresenceTracker() {
  const { user } = useAuth();

  useEffect(() => {
    // Solo invia l'heartbeat se l'utente è loggato
    if (!user) return;

    let lastActivityTime = Date.now();

    const updateActivity = () => {
      lastActivityTime = Date.now();
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);

    const pingHeartbeat = async () => {
      // Se l'utente non ha interagito per più di 4 minuti, fermiamo l'invio dell'heartbeat per farlo cadere in "In Pausa/Stop"
      if (Date.now() - lastActivityTime > 4 * 60 * 1000) {
        return;
      }

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

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
    };
  }, [user]);

  return null; // Componente "silenzioso", non renderizza nulla
}
