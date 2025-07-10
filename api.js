import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@env";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 서버 쿠키 필요시
});

// 요청 인터셉터: SecureStore에서 accessToken 꺼내기
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 자동 토큰 재발급
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // AccessToken 만료일 경우
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        // Refresh API 호출
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/users/refresh_token`,
          {},
          {
            withCredentials: true, // 서버에서 refresh_token 쿠키 사용
          }
        );

        const newAccessToken = refreshResponse.data.access_token;

        // 새 accessToken 저장
        await SecureStore.setItemAsync("accessToken", newAccessToken);

        // Authorization 헤더 갱신 후 재요청
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.log("Refresh Token 만료:", refreshError);
        // refresh도 실패하면 reject
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
