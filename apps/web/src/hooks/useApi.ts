"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

// Базовый URL нашего API
const API_BASE_URL = "http://localhost:3002";

export const useApi = () => {
    const { token, setToken } = useAuth(); // Получаем токен и функцию для его сброса

    // Создаем функцию fetcher, которую будем использовать для всех запросов
    const fetcher = useCallback(
        async (endpoint: string, options: RequestInit = {}) => {
            const url = `${API_BASE_URL}${endpoint}`;
            const headers = {
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

            // Если сервер ответил 401 Unauthorized, это значит токен протух или невалиден.
            // Сбрасываем токен и перезагружаем страницу, чтобы пользователя выкинуло на логин.
            if (response.status === 401) {
                setToken(null);
                // Можно также сделать router.push('/login'), но перезагрузка надежнее
                window.location.reload();
                throw new Error("Session expired. Please log in again.");
            }

            if (!response.ok) {
                // Пытаемся получить тело ошибки от NestJS
                const errorData = await response.json();
                throw new Error(errorData.message || "An API error occurred");
            }

            // Если у ответа есть тело, парсим его как JSON, иначе возвращаем сам ответ
            if (response.headers.get("Content-Length") !== "0") {
                return response.json();
            }

            return response;
        },
        [token, setToken] // Зависимости хука
    );

    return { api: fetcher };
};
