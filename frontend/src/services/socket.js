import { io } from "socket.io-client";

const socket = io(
  import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_BASE_URL ||
    (import.meta.env.DEV
      ? `${window.location.protocol}//${window.location.hostname}:5000`
      : window.location.origin)
);

export default socket;
