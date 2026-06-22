import http from "k6/http";
import { check, sleep } from "k6";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 200 },
    { duration: "1m", target: 200 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.05"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

function signupUser() {
  const email = `loadtest-${randomString(8)}@test.com`;
  const password = "password123";
  const name = `player-${randomString(6)}`;

  const res = http.post(`${BASE_URL}/api/auth/callback/credentials-signup`, {
    email,
    password,
    name,
  });

  return res;
}

function getToken(userId) {
  const res = http.get(`${BASE_URL}/api/auth/token`);
  return res.json().jwt || null;
}

export default function () {
  // Signup new user
  const signupRes = signupUser();
  check(signupRes, { "signup successful": (r) => r.status === 200 });

  // Get session token
  const tokenRes = http.get(`${BASE_URL}/api/auth/token`);
  check(tokenRes, { "token retrieved": (r) => r.status === 200 });

  // Join matchmaking queue
  const joinRes = http.post(
    `${BASE_URL}/api/matchmaking`,
    JSON.stringify({ action: "join", mode: "casual" }),
    { headers: { "Content-Type": "application/json" } },
  );
  check(joinRes, { "joined queue": (r) => r.status === 200 });

  // Check queue status
  const statusRes = http.post(
    `${BASE_URL}/api/matchmaking`,
    JSON.stringify({ action: "status", mode: "casual" }),
    { headers: { "Content-Type": "application/json" } },
  );
  check(statusRes, { "queue status checked": (r) => r.status === 200 });

  // Leave queue
  const leaveRes = http.post(
    `${BASE_URL}/api/matchmaking`,
    JSON.stringify({ action: "leave", mode: "casual" }),
    { headers: { "Content-Type": "application/json" } },
  );
  check(leaveRes, { "left queue": (r) => r.status === 200 });

  sleep(1);
}
