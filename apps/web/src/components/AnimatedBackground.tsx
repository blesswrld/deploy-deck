"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedBackgroundProps {
    children: React.ReactNode;
    className?: string;
}

export const AnimatedBackground = ({
    children,
    className,
}: AnimatedBackgroundProps) => {
    return (
        <div className={cn(className)}>
            {/* --- БЛОК ФОНА --- */}
            <div className="fixed inset-0 -z-20 bg-background">
                <div className="absolute inset-0 overflow-hidden">
                    {/* Первое пятно */}
                    <motion.div
                        className="absolute h-[20rem] w-[20rem] rounded-full"
                        style={{
                            background:
                                "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)",
                            filter: "blur(80px)",
                            top: "10%",
                            left: "20%",
                        }}
                        animate={{
                            x: ["-20%", "40%", "0%", "-30%"],
                            y: ["-30%", "0%", "50%", "20%"],
                        }}
                        transition={{
                            duration: 25,
                            repeat: Infinity,
                            repeatType: "mirror",
                            ease: "easeInOut",
                        }}
                    />
                    {/* Второе пятно */}
                    <motion.div
                        className="absolute h-[25rem] w-[25rem] rounded-full"
                        style={{
                            background:
                                "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)",
                            filter: "blur(100px)",
                            bottom: "10%",
                            right: "20%",
                        }}
                        animate={{
                            x: ["20%", "-40%", "10%", "30%"],
                            y: ["30%", "-10%", "-50%", "-20%"],
                        }}
                        transition={{
                            duration: 30,
                            repeat: Infinity,
                            repeatType: "mirror",
                            ease: "easeInOut",
                            delay: 5,
                        }}
                    />
                </div>
            </div>

            {/* --- БЛОК КОНТЕНТА --- */}
            <div className="relative z-0">{children}</div>
        </div>
    );
};
