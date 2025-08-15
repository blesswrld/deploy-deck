"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface Tag {
    id: string;
    name: string;
    color: string;
}

interface TagBadgeProps {
    tag: Tag;
    onRemove?: (tagId: string) => void;
    className?: string;
}

export const TagBadge = ({ tag, onRemove, className }: TagBadgeProps) => {
    return (
        <div
            className={cn(
                "flex items-center gap-1.5 text-xs font-semibold rounded-full px-2 py-0.5",
                className
            )}
            style={{
                // Применяем цвет с прозрачностью для фона и сплошной цвет для текста
                backgroundColor: `${tag.color}20`, // Добавляем ~12% opacity
                color: tag.color,
            }}
        >
            <span>{tag.name}</span>
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Предотвращаем срабатывание других кликов
                        onRemove(tag.id);
                    }}
                    className="rounded-full hover:bg-black/20"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    );
};
