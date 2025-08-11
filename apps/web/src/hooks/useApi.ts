// apps/web/src/hooks/useApi.ts (ФИНАЛЬНАЯ, ИСПРАВЛЕННАЯ ВЕРСЯ)
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

// Базовый URL нашего API
const API_BASE_URL = "http://localhost:3002";

export const useApi = () => {
    const { token, setToken } = useAuth();

    // Создаем функцию fetcher, которую будем использовать для всех запросов
    const fetcher = useCallback(
        async (endpoint: string, options: RequestInit = {}) => {
            const url = `${API_BASE_URL}${endpoint}`;
            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...options.headers,
            };

            // Если токен есть, добавляем его в заголовок Authorization
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (response.status === 401) {
                setToken(null);
                window.location.reload();
                // Эта ошибка все равно не будет показана из-за перезагрузки.
                throw new Error("Session expired. Please log in again.");
            }

            if (!response.ok) {
                const errorData = await response.json();
                // Пробрасываем ошибку дальше, чтобы ее можно было поймать в .catch()
                throw new Error(errorData.message || "An API error occurred");
            }

            // Если у ответа есть тело, парсим его как JSON, иначе возвращаем сам ответ
            if (response.headers.get("Content-Length") !== "0") {
                return response.json();
            }

            return response;
        },
        [token, setToken]
    );

    return { api: fetcher };
};
