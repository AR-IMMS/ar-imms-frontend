import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth-store";

type SocketCallback<T = unknown> = (data: T) => void;

const getSocketUrlAndPath = () => {
  const apiUrl = process.env.NEXT_PUBLIC_MONITORING_API_URL || "";
  try {
    const url = new URL(apiUrl);
    // If the path contains "/monitoring", the gateway likely routes websocket traffic through "/monitoring/socket.io"
    const hasServicePrefix = url.pathname.includes("/monitoring");
    return {
      url: `${url.origin}/monitoring`,
      path: hasServicePrefix ? "/monitoring/socket.io" : "/socket.io",
    };
  } catch {
    // Fallback if URL parsing fails
    return {
      url: "/monitoring",
      path: "/socket.io",
    };
  }
};

class SocketManager {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<SocketCallback<unknown>>>();

  constructor() {
    if (typeof window === "undefined") {
      return;
    }

    const { url, path } = getSocketUrlAndPath();
    const initialToken = useAuthStore.getState().accessToken;

    this.socket = io(url, {
      path,
      autoConnect: !!initialToken,
      auth: { token: initialToken ? `Bearer ${initialToken}` : "" },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket"],
    });

    // Automatically synchronize connection & tokens with auth store updates
    useAuthStore.subscribe((state) => {
      const token = state.accessToken;
      if (this.socket) {
        this.socket.auth = { token };
        if (token) {
          if (!this.socket.connected) {
            this.socket.connect();
          }
        } else {
          this.socket.disconnect();
        }
      }
    });

    this.socket.on("connect", () => {
      console.log("[SocketManager] Connected to /monitoring namespace");
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`[SocketManager] Disconnected from /monitoring: ${reason}`);
    });

    this.socket.on("connect_error", (error) => {
      console.error("[SocketManager] Connection error on /monitoring:", error);
    });
  }

  /**
   * Subscribes to a socket event. Returns an unsubscribe function.
   * Leverages event multiplexing to register exactly one physical socket listener per event.
   */
  public subscribe<T>(event: string, callback: SocketCallback<T>): () => void {
    if (typeof window === "undefined" || !this.socket) {
      return () => {};
    }

    let callbacks = this.listeners.get(event);
    if (!callbacks) {
      callbacks = new Set();
      this.listeners.set(event, callbacks);

      // Bind a single physical listener on the socket instance
      this.socket.on(event, (data: unknown) => {
        const registered = this.listeners.get(event);
        if (registered) {
          registered.forEach((cb) => {
            try {
              cb(data);
            } catch (err) {
              console.error(
                `[SocketManager] Callback error on event "${event}":`,
                err,
              );
            }
          });
        }
      });
    }

    const genericCallback = callback as SocketCallback<unknown>;
    callbacks.add(genericCallback);

    // Return clean-up unsubscribe function
    return () => {
      const registered = this.listeners.get(event);
      if (registered) {
        registered.delete(genericCallback);
        if (registered.size === 0) {
          this.listeners.delete(event);
          if (this.socket) {
            this.socket.off(event);
          }
        }
      }
    };
  }

  public getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketManager = new SocketManager();
