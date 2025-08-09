import { Skeleton } from "@/components/ui/skeleton";

export function ProjectListSkeleton() {
    return (
        <div className="space-y-4">
            {/* Создаем массив из 3 элементов, чтобы отрендерить 3 скелетона */}
            {Array.from({ length: 3 }).map((_, index) => (
                <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-4"
                >
                    <div className="space-y-2">
                        {/* Имитируем название проекта */}
                        <Skeleton className="h-6 w-48" />
                        {/* Имитируем URL */}
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Имитируем статус и меню */}
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    );
}
