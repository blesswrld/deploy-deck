"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, KeyRound } from "lucide-react";
import useSWR from "swr";
import { useApi } from "@/hooks/useApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useSWRConfig } from "swr"; // <-- Импортируем для обновления кэша
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { AppLoader } from "@/components/AppLoader";

interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
}

export default function ProfilePage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useRequireAuth();
    const { api } = useApi();
    const fetcher = (url: string) => api(url);
    const { data: user, isLoading: isUserLoading } = useSWR<UserProfile>(
        isAuthenticated ? "/users/me" : null,
        fetcher
    );
    const { mutate } = useSWRConfig();

    // Состояния для управления диалогами
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    if (isAuthLoading || !isAuthenticated) {
        return <AppLoader variant="text" text="Loading Profile..." />;
    }

    return (
        <>
            <div className="container mx-auto p-4 md:p-8 max-w-2xl">
                <div className="mb-8">
                    <Link href="/dashboard">
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>

                {isUserLoading || !user ? (
                    <ProfileSkeleton />
                ) : (
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                            <Avatar className="h-20 w-20">
                                <AvatarImage
                                    src={user.avatarUrl ?? undefined}
                                    alt={user.name ?? "User Avatar"}
                                />
                                <AvatarFallback>
                                    {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-2xl break-words">
                                    {user.name}
                                </CardTitle>
                                <CardDescription className="break-words">
                                    {user.email}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Подключаем кнопки к состояниям */}
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => setIsEditProfileOpen(true)}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Profile
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => setIsChangePasswordOpen(true)}
                            >
                                <KeyRound className="mr-2 h-4 w-4" />
                                Change Password
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Рендерим диалоги и передаем им пропсы */}
            {user && (
                <EditProfileDialog
                    isOpen={isEditProfileOpen}
                    onClose={() => setIsEditProfileOpen(false)}
                    currentUser={user}
                    onProfileUpdated={(updatedUser) => {
                        // Обновляем кэш SWR, чтобы UI обновился
                        mutate("/users/me", updatedUser, false);
                    }}
                />
            )}

            <ChangePasswordDialog
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
            />
        </>
    );
}

function ProfileSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-5 w-64" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );
}
