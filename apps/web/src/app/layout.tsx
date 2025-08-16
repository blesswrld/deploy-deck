import type { Metadata } from "next";
import { GeistMono } from "geist/font";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatedBackground } from "@/components/AnimatedBackground";

const geist = GeistMono; // <-- Просто присваиваем, не вызывая как функцию

export const metadata: Metadata = {
    title: "Deploy-Deck",
    description: "Your unified CI/CD dashboard",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark h-full" suppressHydrationWarning={true}>
            {/* Применяем переменную шрифта */}
            <body className={geist.variable}>
                <AuthProvider>
                    <SocketProvider>
                        <TooltipProvider>
                            <AnimatedBackground>{children}</AnimatedBackground>
                        </TooltipProvider>
                    </SocketProvider>
                    <Toaster />
                </AuthProvider>
            </body>
        </html>
    );
}
