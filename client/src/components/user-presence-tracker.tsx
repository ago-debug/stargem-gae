import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export function UserPresenceTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let lastActivityTime = Date.now();

    const pingHeartbeat = async () => {
      // Se l'utente non interagisce da 2 minuti (120 secondi), non inviamo l'heartbeat
      if (Date.now() - lastActivityTime > 2 * 60 * 1000) {
        return;
      }
      try {
        await apiRequest("POST", "/api/users/presence/heartbeat");
      } catch (error) {
        console.error("Failed to ping presence heartbeat", error);
      }
    };

    const updateActivity = () => {
      const now = Date.now();
      // Se ci stiamo risvegliando da una pausa profonda (> 2 minuti), forziamo un ping immediato al server
      if (now - lastActivityTime > 2 * 60 * 1000) {
        lastActivityTime = now;
        pingHeartbeat();
      } else {
        lastActivityTime = now;
      }
    };

    window.addEventListener("mousemove", updateActivity, { passive: true });
    window.addEventListener("keydown", updateActivity, { passive: true });
    window.addEventListener("click", updateActivity, { passive: true });
    window.addEventListener("scroll", updateActivity, { passive: true });

    // Ping immediato iniziale
    pingHeartbeat();

    // Loop heartbeat ogni 20 secondi
    const intervalId = setInterval(pingHeartbeat, 20000);

    const handleUnload = () => {
      navigator.sendBeacon("/api/users/presence/offline");
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("scroll", updateActivity);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [user]);

  return null;
}
