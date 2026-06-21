import { useEffect } from "react";
import { socket } from "@/lib/socket";

export const useSocket = () => {
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log("⚡ Socket Connected:", socket.id);
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, []);
};