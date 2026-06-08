import axios from "axios";
import { getSession } from "next-auth/react";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + "/api/v1",
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session) {
    config.headers.Authorization = `Bearer ${(session as { accessToken?: string }).accessToken}`;
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
