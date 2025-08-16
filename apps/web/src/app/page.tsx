"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
    // Получаем состояние аутентификации из нашего AuthContext
    const { token, isLoading } = useAuth();

    // Функция для рендеринга кнопок в зависимости от статуса
    const renderCallToAction = () => {
        // Пока идет проверка токена, ничего не показываем, чтобы избежать "мигания"
        if (isLoading) {
            return <div className="h-12" />; // Просто заглушка по высоте кнопки
        }

        // Если пользователь залогинен, показываем кнопку "Go to Dashboard"
        if (token) {
            return (
                <Link href="/dashboard" passHref>
                    <Button size="lg">
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            );
        }

        // Если пользователь не залогинен, показываем две кнопки
        return (
            <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login" passHref>
                    <Button size="lg" variant="outline">
                        Sign In
                    </Button>
                </Link>
                <Link href="/signup" passHref>
                    <Button size="lg">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
        );
    };

    return (
        <div className="flex items-center justify-center min-h-screen text-center p-4">
            <motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center gap-6"
            >
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter max-w-2xl">
                    Your Unified CI/CD Dashboard
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg">
                    Stop switching between tabs. Monitor all your deployments
                    and CI checks from Vercel, GitHub, and more in one place.
                </p>
                <div className="mt-4">{renderCallToAction()}</div>
            </motion.main>
        </div>
    );
}
