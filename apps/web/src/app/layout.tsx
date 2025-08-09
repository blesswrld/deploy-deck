import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Импортируем Toaster, который является оберткой над Sonner
import { Toaster } from "@/components/ui/sonner";

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
        <html lang="en" className="dark">
            {/* dark для темной темы по умолчанию */}
            <body className={inter.className}>
                {children}
                <Toaster />
            </body>
        </html>
    );
}
