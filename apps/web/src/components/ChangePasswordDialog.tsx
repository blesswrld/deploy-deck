"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext"; // <-- Импортируем, чтобы получить email
import { useSWRConfig } from "swr"; // <-- Импортируем, чтобы получить данные пользователя

// Схема с проверкой, что пароли не совпадают
const formSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, "Current password is required.") // Просто проверяем, что не пустое
            .min(8, "Password must be at least 8 characters."),
        newPassword: z
            .string()
            .min(8, "New password must be at least 8 characters."),
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: "New password must be different from the current one.",
        path: ["newPassword"], // Ошибка будет на поле newPassword
    });

interface ChangePasswordDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ChangePasswordDialog({
    isOpen,
    onClose,
}: ChangePasswordDialogProps) {
    const { api } = useApi();
    // Получаем кэш SWR, чтобы достать из него email пользователя
    const { cache } = useSWRConfig();
    const user = cache.get("/users/me")?.data;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { currentPassword: "", newPassword: "" },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const promise = api("/users/me/password", {
            method: "PATCH",
            body: JSON.stringify(values),
        });

        toast.promise(promise, {
            loading: "Updating password...",
            success: (data) => {
                onClose();
                form.reset(); // Очищаем форму после успеха
                return data.message || "Password updated successfully!";
            },
            error: (err) => {
                // Если ошибка связана с текущим паролем, покажем ее в поле
                if (err.message.toLowerCase().includes("current password")) {
                    form.setError("currentPassword", {
                        type: "server",
                        message: err.message,
                    });
                }
                return err.message;
            },
        });
    }

    // ФУНКЦИЯ для отправки ссылки
    const handleSendResetLink = () => {
        if (!user?.email) {
            toast.error("Could not find user email to send reset link.");
            return;
        }

        const promise = api("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email: user.email }),
        });

        toast.promise(promise, {
            loading: "Sending reset link...",
            success: "A password reset link has been sent to your email.",
            error: "Failed to send reset link. Please try again.",
        });

        // Закрываем текущее модальное окно после запроса
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                        Enter your current and new password.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* ССЫЛКА "Forgot password?" */}
                        <div className="text-right -mt-2">
                            <Button
                                type="button"
                                variant="link"
                                className="text-xs h-auto p-0"
                                onClick={handleSendResetLink}
                            >
                                Forgot password?
                            </Button>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    form.reset();
                                    onClose();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting}
                            >
                                Update Password
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
