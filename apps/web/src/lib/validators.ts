import * as z from "zod";

export const SignupSchema = z.object({
    name: z
        .string()
        .min(3, { message: "Name must be at least 3 characters long." })
        .max(20, { message: "Name must be at most 20 characters long." })
        .regex(/^[\p{L}\p{N}_-]+$/u, {
            // РЕГУЛЯРНОЕ ВЫРАЖЕНИЕ
            message:
                "Name can only contain letters, numbers, underscore, and hyphen.",
        }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long." }),
});
export const LoginSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(1, { message: "Password is required." }), // Просто проверяем, что не пустое
});
