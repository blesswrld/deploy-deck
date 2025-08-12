"use client";

import { motion } from "framer-motion";
import { User, KeyRound, Server, Cog } from "lucide-react";
import { clsx } from "clsx"; // <-- Импортируем clsx
import { useEffect, useState } from "react";

// Определяем типы для вариантов
type LoaderVariant =
    | "text"
    | "connection"
    | "grid"
    | "matrix"
    | "dots"
    | "settings";

interface AppLoaderProps {
    variant?: LoaderVariant;
    text?: string;
}

// Компонент для "Кинетической Типографии"
const TextLoader = ({ text }: { text: string }) => {
    const container = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
    };
    const child = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", damping: 12, stiffness: 100 },
        },
    };
    return (
        <motion.div
            className="flex items-center justify-center min-h-screen text-xl font-medium tracking-wider text-slate-300"
            variants={container}
            initial="hidden"
            animate="visible"
        >
            {text.split("").map((char, index) => (
                <motion.span key={index} variants={child}>
                    {char}
                </motion.span>
            ))}
        </motion.div>
    );
};

// Компонент для "Безопасного Соединения"
const ConnectionLoader = ({ text }: { text: string }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
            <div className="relative flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <User className="w-8 h-8 text-slate-400 absolute -left-20" />
                </motion.div>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <KeyRound className="w-10 h-10 text-slate-300" />
                </motion.div>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <Server className="w-8 h-8 text-slate-400 absolute -right-20" />
                </motion.div>
                <svg className="absolute w-40 h-10" viewBox="0 0 160 40">
                    <motion.path
                        d="M 25 20 L 65 20"
                        stroke="#475569"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                    />
                    <motion.path
                        d="M 95 20 L 135 20"
                        stroke="#475569"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 1.0, duration: 0.5 }}
                    />
                </svg>
            </div>
            <p className="text-slate-400 animate-pulse">{text}</p>
        </div>
    );
};

// Компонент для "Пульсирующей Сетки"
const GridLoader = ({ text }: { text: string }) => {
    return (
        <div className="flex items-center justify-center min-h-screen">
            Grid Loader: {text}
        </div>
    );
};

//  "Матрица логов" (для страницы деталей проекта)
const MatrixLoader = ({ text }: { text: string }) => {
    const [lines, setLines] = useState<string[]>([]);

    // Генерируем случайные строки только на клиенте, один раз при монтировании
    useEffect(() => {
        const generatedLines = Array.from({ length: 5 }).map(
            () =>
                `${Math.random().toString(36).substring(2, 15)} ${Math.random().toString(36).substring(2, 15)}`
        );
        setLines(generatedLines);
    }, []); // Пустой массив зависимостей = выполнить один раз на клиенте

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 font-mono text-xs text-slate-500">
            <div className="w-full max-w-md p-4 space-y-1 h-24">
                {" "}
                {/* Задаем высоту, чтобы избежать скачков */}
                {lines.map((line, i) => (
                    <motion.p
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.4,
                        }}
                    >
                        &gt; {line}
                    </motion.p>
                ))}
            </div>
            <p className="mt-4 text-base text-slate-400 animate-pulse">
                {text}
            </p>
        </div>
    );
};

//  "Пульсирующие точки"
const DotsLoader = ({ text }: { text: string }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-3 h-3 bg-slate-400 rounded-full"
                        animate={{ y: ["0%", "-50%", "0%"] }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.2,
                        }}
                    />
                ))}
            </div>
            <p className="text-slate-400">{text}</p>
        </div>
    );
};

// "Вращающиеся шестеренки" (для страницы настроек)
const SettingsLoader = ({ text }: { text: string }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <div className="relative h-16 w-16">
                {/* Большая шестеренка, вращается медленно */}
                <motion.div
                    className="absolute"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                >
                    <Cog className="h-16 w-16 text-slate-400" strokeWidth={1} />
                </motion.div>

                {/* Маленькая шестеренка, вращается быстрее и в другую сторону */}
                <motion.div
                    className="absolute"
                    style={{ top: "2.4rem", left: "2.4rem" }}
                    animate={{ rotate: -360 }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                >
                    <Cog className="h-8 w-8 text-slate-500" strokeWidth={1.5} />
                </motion.div>
            </div>
            <p className="text-slate-400 mt-4">{text}</p>
        </div>
    );
};

// Главный компонент, который выбирает, какой лоадер показать
export const AppLoader = ({
    variant = "text",
    text = "Loading...",
}: AppLoaderProps) => {
    switch (variant) {
        case "connection":
            return <ConnectionLoader text={text} />;
        case "grid":
            return <GridLoader text={text} />;
        case "matrix":
            return <MatrixLoader text={text} />;
        case "dots":
            return <DotsLoader text={text} />;
        // Добавляем новый вариант
        case "settings":
            return <SettingsLoader text={text} />;
        case "text":
        default:
            return <TextLoader text={text} />;
    }
};
