"use client";

import { motion } from "framer-motion";

interface ButtonLoaderProps {
    text?: string;
}

export const ButtonLoader = ({ text }: ButtonLoaderProps) => {
    return (
        <div className="flex items-center justify-center gap-2">
            {/* Контейнер для точек */}
            <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-1.5 h-1.5 bg-current rounded-full"
                        animate={{ y: ["0%", "-75%", "0%"] }}
                        transition={{
                            duration: 1.0,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.15,
                        }}
                    />
                ))}
            </div>
            {/* Отображаем текст, если он передан */}
            {text && <span>{text}</span>}
        </div>
    );
};
