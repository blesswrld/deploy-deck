"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export const useRequireAuth = () => {
    const { token, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Ждем, пока AuthContext завершит первоначальную загрузку токена
        if (isLoading) {
            return; // Ничего не делаем, пока идет загрузка
        }

        // Если загрузка завершена и токена нет, перенаправляем на логин
        if (!token) {
            router.push("/login");
        }
    }, [token, isLoading, router]);

    // Возвращаем состояние, чтобы компонент мог показывать заглушку
    return { isAuthenticated: !!token, isLoading };
};
