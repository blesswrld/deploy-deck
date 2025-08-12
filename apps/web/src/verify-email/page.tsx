"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppLoader } from "@/components/AppLoader";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [verificationStatus, setVerificationStatus] = useState<
        "loading" | "success" | "error"
    >("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setVerificationStatus("error");
            setErrorMessage("Verification token is missing.");
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await fetch(
                    `http://localhost:3002/auth/verify-email?token=${token}`
                );
                const data = await response.json();

                if (!response.ok) throw new Error(data.message);

                setVerificationStatus("success");
                // Через 3 секунды перенаправляем на логин
                setTimeout(() => router.push("/login"), 3000);
            } catch (err: any) {
                setVerificationStatus("error");
                setErrorMessage(err.message || "An unknown error occurred.");
            }
        };

        verifyToken();
    }, [token, router]);

    if (verificationStatus === "loading") {
        return <AppLoader variant="dots" text="Verifying your email..." />;
    }

    return (
        <div className="flex items-center justify-center min-h-screen text-center">
            <div>
                {verificationStatus === "success" && (
                    <>
                        <h1 className="text-2xl font-bold text-green-500">
                            Email Verified!
                        </h1>
                        <p className="mt-2">
                            Your account has been activated. Redirecting you to
                            the login page...
                        </p>
                    </>
                )}
                {verificationStatus === "error" && (
                    <>
                        <h1 className="text-2xl font-bold text-red-500">
                            Verification Failed
                        </h1>
                        <p className="mt-2">{errorMessage}</p>
                        <Button asChild className="mt-4">
                            <Link href="/signup">Back to Sign Up</Link>
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
