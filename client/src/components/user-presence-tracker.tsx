import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export function UserPresenceTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let lastHeartbeatSent = 0;

    const pingHeartbeat = async () => {
      const now = Date.now();
      // Throttle di 30 secondi per evitare spam al server
      if (now - lastHeartbeatSent < 30 * 1000) {
        return;
      }
      lastHeartbeatSent = now;
      
      try {
        await apiRequest("POST", "/api/users/presence/heartbeat");
      } catch (error) {
        console.error("Failed to ping presence heartbeat", error);
      }
    };

    // Ping immediato iniziale al caricamento
    pingHeartbeat();

    // Event handler throttling
    const handleActivity = () => {
      pingHeartbeat();
    };

    // Ascolta gli eventi reali
    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("click", handleActivity, { passive: true });
    window.addEventListener("scroll", handleActivity, { passive: true });
    window.addEventListener("mousedown", handleActivity, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });

    const handleUnload = () => {
      navigator.sendBeacon("/api/users/presence/offline");
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [user]);

  return null;
}
