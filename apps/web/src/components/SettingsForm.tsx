"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";

const formSchema = z.object({
    token: z
        .string()
        .length(24, "Vercel API token must be 24 characters long."),
});

export function SettingsForm() {
    const { api } = useApi();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            token: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const promise = api("/integrations/vercel", {
            method: "POST",
            body: JSON.stringify(values),
        });

        toast.promise(promise, {
            loading: "Connecting Vercel account...",
            success: "Vercel account connected successfully!",
            error: (err) => err.message || "Failed to connect Vercel account.",
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="token"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Vercel API Token</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                You can generate a token in your Vercel account
                                settings.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    Save Connection
                </Button>
            </form>
        </Form>
    );
}
