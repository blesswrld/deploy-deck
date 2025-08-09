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

// Схема с проверкой, что пароли не совпадают
const formSchema = z
    .object({
        currentPassword: z
            .string()
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
                return data.message || "Password updated successfully!";
            },
            error: (err) => err.message,
        });
    }

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
                        className="space-y-8"
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
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
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
