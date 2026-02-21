import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 20,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:5173"; 


export default function () {
  const missionsRes = http.get(`${BASE_URL}/api/missions`);
  check(missionsRes, {
    "GET /api/missions status 200": (r) => r.status === 200,
    "GET /api/missions returns array": (r) => {
      const body = JSON.parse(r.body);
      return Array.isArray(body);
    },
  });

  const rewardsRes = http.get(`${BASE_URL}/api/rewards`);
  check(rewardsRes, {
    "GET /api/rewards status 200": (r) => r.status === 200,
    "GET /api/rewards returns array": (r) => {
      const body = JSON.parse(r.body);
      return Array.isArray(body);
    },
  });

  const configRes = http.get(`${BASE_URL}/api/config/supabase`);
  check(configRes, {
    "GET /api/config/supabase status 200": (r) => r.status === 200,
  });

  sleep(1);
}
