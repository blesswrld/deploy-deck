import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Импортируем Toaster, который является оберткой над Sonner
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

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
        <html lang="en" className="dark" suppressHydrationWarning={true}>
            {/* dark для темной темы по умолчанию */}
            <body className={inter.className}>
                <AuthProvider>
                    <TooltipProvider>
                        <AnimatedBackground>{children}</AnimatedBackground>
                    </TooltipProvider>
                    <Toaster />
                </AuthProvider>
            </body>
        </html>
    );
}
