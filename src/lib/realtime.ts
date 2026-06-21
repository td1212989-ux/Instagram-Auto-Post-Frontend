import { socket } from "./socket";
import type { QueryClient } from "@tanstack/react-query";

let initialized = false;

export function initRealtime(queryClient: QueryClient) {
  if (initialized) {
    return;
  }

  initialized = true;

  /**
   * ======================================
   * REMOVE OLD LISTENERS (HMR SAFE)
   * ======================================
   */
  socket.off("connect");
socket.off("disconnect");

socket.off("queue:update");
socket.off("dashboard:update");
socket.off("history:update");
socket.off("refresh:all"); // <-- add this
  /**
   * ======================================
   * CONNECTION
   * ======================================
   */
  socket.on("connect", () => {
    console.log("🟢 Realtime Connected:", socket.id);

    queryClient.invalidateQueries({
      queryKey: ["dashboard"],
    });

    queryClient.invalidateQueries({
      queryKey: ["pending"],
    });

    queryClient.invalidateQueries({
      queryKey: ["history"],
    });
  });

  socket.on("disconnect", (reason) => {
    console.log("🔴 Realtime Disconnected:", reason);
  });

  /**
   * ======================================
   * QUEUE UPDATE
   * ======================================
   */
  socket.on("queue:update", async () => {
    console.log("🔄 queue:update");

    await queryClient.invalidateQueries({
      queryKey: ["pending"],
    });
  });

  /**
   * ======================================
   * DASHBOARD UPDATE
   * ======================================
   */
  socket.on("dashboard:update", async () => {
    console.log("📊 dashboard:update");

    await queryClient.invalidateQueries({
      queryKey: ["dashboard"],
    });
  });

  /**
   * ======================================
   * HISTORY UPDATE
   * ======================================
   */
  socket.on("history:update", async () => {
    console.log("📜 history:update");

    await queryClient.invalidateQueries({
      queryKey: ["history"],
    });
  });

  /**
   * ======================================
   * GLOBAL REFRESH
   * ======================================
   */
  socket.on("refresh:all", async () => {
    console.log("♻️ refresh:all");

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["pending"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["history"],
      }),
    ]);
  });
}