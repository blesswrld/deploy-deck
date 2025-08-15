"use client";

import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "./ui/card";

interface ChecklistItemProps {
    isCompleted: boolean;
    title: string;
    description: string;
    href?: string; // href теперь опциональный
    onClick?: () => void; // onClick тоже опциональный
}

// Делаем компонент более гибким
const ChecklistItem = ({
    isCompleted,
    title,
    description,
    href,
    onClick,
}: ChecklistItemProps) => {
    const content = (
        <div
            className={cn(
                "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                isCompleted
                    ? "bg-muted/50 border-transparent cursor-default"
                    : "hover:bg-muted/50 cursor-pointer"
            )}
        >
            <div
                className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2",
                    isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-transparent"
                )}
            >
                {isCompleted && <Check className="h-4 w-4" />}
            </div>
            <div className="flex-grow">
                <p
                    className={cn(
                        "font-semibold",
                        isCompleted && "text-muted-foreground line-through"
                    )}
                >
                    {title}
                </p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {!isCompleted && (
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
            )}
        </div>
    );

    // Если есть onClick, оборачиваем в Button, если href - в Link
    if (onClick) {
        return (
            <button onClick={onClick} className="w-full text-left">
                {content}
            </button>
        );
    }
    return <Link href={href!}>{content}</Link>;
};

interface OnboardingChecklistProps {
    user: {
        hasVercelToken: boolean;
        hasGithubToken: boolean;
    };
    hasProjects: boolean;
    onImportClick: () => void; // <-- ПРОП
}

export const OnboardingChecklist = ({
    user,
    hasProjects,
    onImportClick,
}: OnboardingChecklistProps) => {
    return (
        <Card className="bg-transparent border-dashed">
            <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                    Follow these steps to set up your dashboard.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 flex flex-col">
                <ChecklistItem
                    isCompleted={user.hasVercelToken}
                    title="Connect Vercel Account"
                    description="Link your Vercel account to get deployment statuses."
                    href="/settings"
                />
                <ChecklistItem
                    isCompleted={user.hasGithubToken}
                    title="Connect GitHub Account"
                    description="Link your GitHub account to get CI checks."
                    href="/settings"
                />
                <ChecklistItem
                    isCompleted={hasProjects}
                    title="Import your first project"
                    description="Import a project to see it on your dashboard."
                    onClick={onImportClick} // <-- ИСПОЛЬЗУЕМ ПРОП
                />
            </CardContent>
        </Card>
    );
};
