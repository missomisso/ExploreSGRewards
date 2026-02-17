/**
 * Part D: Performance Test — k6 Load Test
 *
 * Simulates 20 virtual users (VUs) hitting the API concurrently.
 * Defines a threshold so that 95% of requests must complete under 500ms.
 *
 * Pre-requisite: The app must be running on http://localhost:5000
 *   Start it with: npm run dev
 *
 * Install k6:
 *   - macOS:   brew install k6
 *   - Linux:   sudo snap install k6
 *   - Windows: choco install k6
 *
 * Run this test with:
 *   k6 run tests/performance/loadTest.js
 */

import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 20,
  duration: "30s",

  thresholds: {
    http_req_duration: ["p(95)<5000"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const BASE_URL = "http://localhost:5000";

  // Scenario 1: GET /api/missions — List all missions
  const missionsRes = http.get(`${BASE_URL}/api/missions`);
  check(missionsRes, {
    "GET /api/missions status is 200": (r) => r.status === 200,
    "GET /api/missions returns array": (r) => {
      const body = JSON.parse(r.body);
      return Array.isArray(body) && body.length > 0;
    },
  });

  // Scenario 2: GET /api/missions/1 — Single mission detail
  const detailRes = http.get(`${BASE_URL}/api/missions/1`);
  check(detailRes, {
    "GET /api/missions/1 status is 200": (r) => r.status === 200,
    "GET /api/missions/1 has title": (r) => {
      const body = JSON.parse(r.body);
      return body.title !== undefined;
    },
  });

  // Scenario 3: GET /api/rewards — List rewards
  const rewardsRes = http.get(`${BASE_URL}/api/rewards`);
  check(rewardsRes, {
    "GET /api/rewards status is 200": (r) => r.status === 200,
  });

  // Scenario 4: GET /api/config/supabase — Config endpoint
  const configRes = http.get(`${BASE_URL}/api/config/supabase`);
  check(configRes, {
    "GET /api/config/supabase status is 200": (r) => r.status === 200,
  });

  sleep(1);
}
