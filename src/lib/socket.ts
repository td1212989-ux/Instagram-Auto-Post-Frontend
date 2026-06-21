import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * =========================
 * SINGLETON SOCKET INSTANCE
 * =========================
 */
let socketInstance: Socket | null = null;

export const socket: Socket = getSocket();

/**
 * =========================
 * SOCKET FACTORY (SAFE SINGLETON)
 * =========================
 */
function getSocket(): Socket {
  if (socketInstance) return socketInstance;

  socketInstance = io(SOCKET_URL, {
    transports: ["websocket"],
    withCredentials: true,

    autoConnect: true,

    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,

    timeout: 20000,
  });

  registerEvents(socketInstance);

  return socketInstance;
}

/**
 * =========================
 * EVENT REGISTRATION
 * =========================
 */
function registerEvents(socket: Socket) {
  socket.on("connect", () => {
    console.log("🟢 Socket Connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔴 Socket Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket Connection Error:", err.message);
  });

  socket.io.on("reconnect", (attempt) => {
    console.log(`🟢 Reconnected (Attempt ${attempt})`);
  });

  socket.io.on("reconnect_attempt", (attempt) => {
    console.log(`🔄 Reconnect Attempt ${attempt}`);
  });

  socket.io.on("reconnect_error", (err) => {
    console.error("❌ Reconnect Error:", err.message);
  });

  socket.io.on("reconnect_failed", () => {
    console.error("❌ Reconnect Failed");
  });

  /**
   * =========================
   * BACKEND EVENTS (AUTO READY)
   * =========================
   */
  socket.on("queue:update", (data) => {
    console.log("🔄 Queue Update:", data);
  });

  socket.on("dashboard:update", (data) => {
    console.log("📊 Dashboard Update:", data);
  });

  socket.on("history:update", (data) => {
    console.log("📜 History Update:", data);
  });
}

/**
 * =========================
 * SAFE HMR SUPPORT
 * =========================
 */
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
  });
}

/**
 * =========================
 * EXPORT HELPERS
 * =========================
 */
export const getSocketInstance = () => socketInstance;

export default socket;