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
import { ChangeEvent, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
});

interface EditProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onProfileUpdated: (updatedUser: any) => void;
    currentUser: { name?: string | null; avatarUrl?: string | null };
}

// Создаем клиент Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function EditProfileDialog({
    isOpen,
    onClose,
    onProfileUpdated,
    currentUser,
}: EditProfileDialogProps) {
    const { api } = useApi();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        values: {
            name: currentUser.name ?? "",
        },
    });
    const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(
        null
    );
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    // Обработчик выбора файла
    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setNewAvatarPreview(URL.createObjectURL(file));
        }
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        let finalAvatarUrl = currentUser.avatarUrl;

        // Если выбран новый аватар, загружаем его
        if (avatarFile) {
            try {
                // 1. Получаем signed URL от нашего бэкенда
                const { path, token } = await api(
                    "/integrations/avatars/upload-url",
                    {
                        method: "POST",
                        body: JSON.stringify({ fileType: avatarFile.type }),
                    }
                );

                // 2. Загружаем файл напрямую в Supabase
                const { error: uploadError } = await supabase.storage
                    .from("avatars")
                    .uploadToSignedUrl(path, token, avatarFile);

                if (uploadError) throw uploadError;

                // 3. Получаем публичный URL загруженного файла
                const { data } = supabase.storage
                    .from("avatars")
                    .getPublicUrl(path);
                finalAvatarUrl = data.publicUrl;
            } catch (error) {
                toast.error("Avatar upload failed.");
                return;
            }
        }

        // 4. Обновляем профиль с новым именем и/или URL аватара
        const promise = api("/users/me", {
            method: "PATCH",
            body: JSON.stringify({
                name: values.name,
                avatarUrl: finalAvatarUrl,
            }),
        });

        toast.promise(promise, {
            loading: "Updating profile...",
            success: (updatedUser) => {
                onProfileUpdated(updatedUser);
                setNewAvatarPreview(null); // Сбрасываем превью после сохранения
                setAvatarFile(null);
                onClose();
                return "Profile updated successfully!";
            },
            error: (err) => err.message,
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Make changes to your profile here. Click save when you
                        are done.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage
                            src={
                                newAvatarPreview ??
                                currentUser.avatarUrl ??
                                undefined
                            }
                        />
                        <AvatarFallback>
                            {currentUser.name?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <Input
                        id="picture"
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleAvatarChange}
                    />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8 pt-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Your Name"
                                            {...field}
                                        />
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
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
