import { Skeleton } from "@/components/ui/skeleton";

export function ProjectListSkeleton() {
    return (
        <div className="space-y-4">
            {/* Создаем массив из 3 элементов, чтобы отрендерить 3 скелетона */}
            {Array.from({ length: 5 }).map((_, index) => (
                <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 gap-4"
                >
                    {/* Левая часть скелетона */}
                    <div className="flex-grow space-y-2 w-full">
                        {/* Имитируем название проекта/сообщение коммита */}
                        <Skeleton className="h-6 w-3/4" />

                        {/* Имитируем мета-данные (автор, ветка, коммит) */}
                        <div className="flex flex-wrap items-center gap-4">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>

                    {/* Правая часть скелетона */}
                    <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between">
                        {/* Имитируем статус */}
                        <Skeleton className="h-4 w-16" />
                        {/* Имитируем время */}
                        <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                </div>
            ))}
        </div>
    );
}
