"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Создадим тип для данных пользователя
interface User {
    id: string;
    email: string;
}

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            // 1. Получаем токен из localStorage
            const token = localStorage.getItem("accessToken");

            if (!token) {
                // Если токена нет, немедленно перекидываем на логин
                router.push("/login");
                return;
            }

            try {
                // 2. Делаем запрос на защищенный эндпоинт
                const response = await fetch("http://localhost:3002/users/me", {
                    method: "GET",
                    headers: {
                        // 3. Передаем токен в заголовке Authorization
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.status === 401) {
                    // Если токен невалидный (например, истек), тоже кидаем на логин
                    throw new Error("Unauthorized");
                }

                if (!response.ok) {
                    throw new Error("Failed to fetch user profile");
                }

                const userData = await response.json();
                setUser(userData);
            } catch (err) {
                // В случае любой ошибки (включая 401) - удаляем невалидный токен и редиректим
                localStorage.removeItem("accessToken");
                router.push("/login");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Loading...
            </div>
        );
    }

    if (user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-4xl font-bold">
                    Welcome to your Dashboard!
                </h1>
                <p className="mt-4 text-lg">
                    Your email is:{" "}
                    <span className="font-mono bg-gray-200 p-1 rounded">
                        {user.email}
                    </span>
                </p>
            </div>
        );
    }

    // Этот return не должен сработать, так как useEffect сделает редирект,
    // но он нужен на случай, если что-то пойдет не так
    return null;
}
