import { useEffect, useRef } from "react";
import { socket } from "@/lib/socket";
import { DashboardService } from "@/services/api";

type Callback = (data: any) => void;

/**
 * =========================
 * REALTIME DASHBOARD HOOK
 * =========================
 */
export const useDashboardRealtime = (onUpdate?: Callback) => {
  const latestCallback = useRef<Callback | undefined>(onUpdate);

  /**
   * Keep latest callback fresh
   */
  useEffect(() => {
    latestCallback.current = onUpdate;
  }, [onUpdate]);

  /**
   * =========================
   * FETCH DASHBOARD DATA
   * =========================
   */
  const fetchDashboard = async () => {
    try {
      const data = await DashboardService.get();

      if (latestCallback.current) {
        latestCallback.current(data);
      }

      return data;
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  };

  /**
   * =========================
   * SOCKET LISTENERS
   * =========================
   */
  useEffect(() => {
    // initial load
    fetchDashboard();

    const handleUpdate = async (data: any) => {
      console.log("📊 Dashboard realtime update:", data);

      // re-fetch fresh dashboard state
      await fetchDashboard();
    };

    socket.on("dashboard:update", handleUpdate);

    socket.on("queue:update", handleUpdate);

    socket.on("history:update", handleUpdate);

    /**
     * CLEANUP
     */
    return () => {
      socket.off("dashboard:update", handleUpdate);
      socket.off("queue:update", handleUpdate);
      socket.off("history:update", handleUpdate);
    };
  }, []);

  return {
    refresh: fetchDashboard,
  };
};