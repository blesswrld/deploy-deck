"use client";

import { useState } from "react"; // <-- Импортируем хук для состояния
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation"; // <-- Импортируем хук для редиректа
import { toast } from "sonner";

export default function SignupPage() {
    // === БЛОК 1: Состояние для полей ввода и ошибок ===
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null); // Для хранения текста ошибки
    const [isLoading, setIsLoading] = useState(false); // Чтобы блокировать кнопку во время запроса
    const router = useRouter(); // Получаем доступ к роутеру Next.js

    // === БЛОК 2: Функция-обработчик отправки формы ===
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // Предотвращаем стандартную перезагрузку страницы
        setIsLoading(true); // Блокируем кнопку
        setError(null); // Сбрасываем старые ошибки

        try {
            // Отправляем запрос на наш бэкенд
            const response = await fetch("http://localhost:3002/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Если сервер ответил ошибкой (например, 409 Conflict), показываем ее
                throw new Error(data.message || "Something went wrong");
            }

            // Если все успешно, можно перенаправить пользователя на страницу входа
            toast.success("Account created successfully!", {
                description: "You can now log in.",
            });
            router.push("/login"); // <-- Редирект на страницу входа
        } catch (err: any) {
            // Ловим ошибку и отображаем ее
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsLoading(false); // Разблокируем кнопку в любом случае
        }
    };

    // === БЛОК 3: Привязываем состояние и обработчик к JSX ===
    return (
        <div className="flex items-center justify-center min-h-screen p-4 md:p-8 bg-gray-100 dark:bg-gray-900">
            {/* Оборачиваем карточку в тег <form> и вешаем на него наш обработчик */}
            <form onSubmit={handleSubmit}>
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl">Sign Up</CardTitle>
                        <CardDescription>
                            Enter your email below to create your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                value={email} // Привязываем к состоянию
                                onChange={(e) => setEmail(e.target.value)} // Обновляем состояние при вводе
                                disabled={isLoading} // Блокируем поле во время запроса
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="*****"
                                required
                                value={password} // Привязываем к состоянию
                                onChange={(e) => setPassword(e.target.value)} // Обновляем состояние при вводе
                                disabled={isLoading} // Блокируем поле во время запроса
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading
                                ? "Creating account..."
                                : "Create account"}
                        </Button>
                        {/* Отображаем ошибку, если она есть */}
                        {error && (
                            <p className="text-sm font-medium text-red-500">
                                {error}
                            </p>
                        )}
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
