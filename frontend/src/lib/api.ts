import axios from "axios";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://reading-path-production.up.railway.app";

const api = axios.create({
  baseURL: BACKEND_URL + "/api/v1",
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  try {
    const res = await fetch("/api/auth/session");
    if (res.ok) {
      const session = await res.json();
      const token = session?.accessToken as string | undefined;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // 세션 조회 실패 시 토큰 없이 요청 계속
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.error?.message ?? "알 수 없는 오류가 발생했습니다.";
    return Promise.reject(new Error(message));
  }
);

export default api;
