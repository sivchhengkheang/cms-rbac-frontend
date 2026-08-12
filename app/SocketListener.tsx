"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL, clearAuth, getAuthUser } from "./lib/auth";
import { getCurrentUser } from "./lib/api";

export default function SocketListener() {
  useEffect(() => {
    const socket = io(API_BASE_URL, {
      autoConnect: true,
      reconnection: true,
    });

    let validationTimer: ReturnType<typeof setTimeout> | null = null;

    const validateCurrentUser = async () => {
      try {
        const me = (await getCurrentUser()) as any;
        if (!me || !me.user) {
          throw new Error("Current user missing");
        }
      } catch (error) {
        clearAuth();
        window.location.replace("/login");
      }
    };

    const scheduleValidation = () => {
      if (!getAuthUser()) return;
      if (validationTimer) clearTimeout(validationTimer);
      validationTimer = setTimeout(() => {
        validateCurrentUser();
        validationTimer = null;
      }, 10000);
    };

    socket.on("user:deleted", scheduleValidation);
    socket.on("user:updated", scheduleValidation);
    socket.on("user:changed", scheduleValidation);

    return () => {
      if (validationTimer) clearTimeout(validationTimer);
      socket.disconnect();
    };
  }, []);

  return null;
}
