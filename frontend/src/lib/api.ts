import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + "/api/v1",
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  // getSession()은 NextAuth v5에서 커스텀 필드를 신뢰할 수 없어
  // /api/auth/session을 직접 호출해서 accessToken을 가져옴
  const res = await fetch("/api/auth/session");
  if (res.ok) {
    const session = await res.json();
    const token = session?.accessToken as string | undefined;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
