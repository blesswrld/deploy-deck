"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function CheckEmailPage() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-sm text-center bg-card/85 backdrop-blur-sm border-white/10">
                <CardHeader>
                    <CardTitle className="flex flex-col items-center gap-4">
                        <Mail className="w-12 h-12 text-primary" />
                        Check Your Email
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>
                        We've sent a verification link to your email address.
                        Please click the link to activate your account.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
