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
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";

// 1. Схема валидации с помощью Zod
const formSchema = z.object({
    name: z.string().min(3, {
        message: "Project name must be at least 3 characters.",
    }),
    gitUrl: z.string().url({ message: "Please enter a valid URL." }),
});

// 2. Определяем пропсы для нашего компонента
interface AddProjectFormProps {
    onProjectAdded: (newProject: any) => void; // Функция обратного вызова
    onProjectUpdated: (updatedProject: any) => void;
    onClose: () => void; // Функция для закрытия модального окна
    projectToEdit?: any; // <-- Необязательный пропс с данными проекта
}

export function AddProjectForm({
    onProjectAdded,
    onProjectUpdated,
    onClose,
    projectToEdit,
}: AddProjectFormProps) {
    const { api } = useApi();

    // 3. Настраиваем react-hook-form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: projectToEdit?.name || "",
            gitUrl: projectToEdit?.gitUrl || "",
        },
    });

    // 4. Функция-обработчик отправки формы
    async function onSubmit(values: z.infer<typeof formSchema>) {
        const isEditing = !!projectToEdit;
        const endpoint = isEditing
            ? `/projects/${projectToEdit.id}`
            : "/projects";
        const method = isEditing ? "PATCH" : "POST";

        const promise = api(endpoint, {
            method: method,
            body: JSON.stringify(values),
        });

        toast.promise(promise, {
            loading: isEditing ? "Updating project..." : "Adding project...",
            // success и error принимают данные/ошибку как аргумент
            success: (result) => {
                if (isEditing) {
                    onProjectUpdated(result); // Обновляем проекты
                } else {
                    onProjectAdded(result);
                }
                onClose(); // Закрываем модальное окно
                return `Project ${isEditing ? "updated" : "added"} successfully!`;
            },
            error: (err) =>
                err.message ||
                `Failed to ${isEditing ? "update" : "add"} project`,
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Project Name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="My Awesome Website"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="gitUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Git Repository URL</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="https://github.com/user/repo.git"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                    >
                        Add Project
                    </Button>
                </div>
            </form>
        </Form>
    );
}
