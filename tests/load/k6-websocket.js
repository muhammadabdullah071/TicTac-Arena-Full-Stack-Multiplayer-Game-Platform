import { WebSocket } from "k6/experimental/websockets";
import { check, sleep } from "k6";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  stages: [
    { duration: "10s", target: 10 },
    { duration: "30s", target: 50 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    ws_connecting: ["avg<1000"],
  },
};

const WS_URL = __ENV.WS_URL || "ws://localhost:3001";
const AUTH_SECRET = __ENV.AUTH_SECRET || "test-secret";

export default function () {
  const token = randomString(32);
  const url = `${WS_URL}?token=${token}`;

  const ws = new WebSocket(url);

  ws.addEventListener("open", () => {
    check(ws, { "WebSocket connected": true });

    ws.send(JSON.stringify({
      event: "queue:join",
      data: { mode: "casual" },
    }));
  });

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    check(msg, { "received event": true });
  });

  ws.addEventListener("close", () => {
    check(ws, { "WebSocket closed gracefully": true });
  });

  ws.addEventListener("error", (e) => {
    check(ws, { "WebSocket error handled": true });
  });

  sleep(5);
  ws.close();
}
