"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion"; // <-- Импорт для анимации
import { useSocket } from "@/contexts/SocketContext";
import { useApi } from "@/hooks/useApi";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import useSWR, { useSWRConfig } from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    LogOut,
    MoreVertical,
    PlusCircle,
    Settings,
    UserCircle,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddProjectForm } from "@/components/AddProjectForm";
import Link from "next/link";
import { LinkVercelDialog } from "@/components/LinkVercelDialog";
import { ProjectListSkeleton } from "@/components/ProjectListSkeleton";
import { ImportVercelDialog } from "@/components/ImportVercelDialog";
import { AppLoader } from "@/components/AppLoader";
import { ProjectListItem } from "@/components/ProjectListItem";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { useProjectHotkeys } from "@/hooks/useProjectHotkeys";
import { DashboardSummary } from "@/components/DashboardSummary";
import { PaginationControls } from "@/components/PaginationControls"; // <-- ИМПОРТ ПАГИНАЦИИ

interface Project {
    id: string;
    name: string;
    gitUrl: string;
    vercelProjectId?: string | null;
    deploymentStatus: any; // Используем any для простоты
    checksStatus: any;
}

// Добавляем тип для пользователя
interface UserProfile {
    hasVercelToken: boolean;
    hasGithubToken: boolean;
}

// ТИП ДЛЯ ОТВЕТА API
interface PaginatedProjectsResponse {
    data: Project[];
    totalPages: number;
    currentPage: number;
    totalCount: number;
}

export default function DashboardPage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useRequireAuth();
    const { setToken } = useAuth();
    const { api } = useApi();

    // Состояние для текущей страницы
    const [currentPage, setCurrentPage] = useState(1);

    // Динамический ключ для SWR
    const projectsSWRKey = isAuthenticated
        ? `/projects?page=${currentPage}&limit=5`
        : null;

    // --- ЕДИНСТВЕННЫЙ ИСТОЧНИК ДАННЫХ О ПРОЕКТАХ ---
    const fetcher = (url: string) => api(url);
    const {
        data: paginatedResponse,
        error: projectsError,
        isLoading: isLoadingProjects,
        // isValidating, // <-- ПОЛУЧАЕМ isValidating
        mutate,
    } = useSWR<PaginatedProjectsResponse>(projectsSWRKey, fetcher, {
        refreshInterval: 5000,
        onError: (err) => {
            toast.error(`Failed to fetch projects: ${err.message}`);
        },
        keepPreviousData: true,
    });

    // Извлекаем данные из ответа
    const projects = paginatedResponse?.data;
    const totalPages = paginatedResponse?.totalPages || 1;

    const { mutate: globalMutate } = useSWRConfig(); // <-- ПОЛУЧАЕМ ГЛОБАЛЬНЫЙ MUTATE

    // ВЫЧИСЛЕНИЕ МЕТРИК
    const summaryMetrics = {
        totalProjects: paginatedResponse?.totalCount || 0,
        deployingCount:
            paginatedResponse?.data?.filter(
                (p) =>
                    p.deploymentStatus?.status === "BUILDING" ||
                    p.deploymentStatus?.status === "QUEUED"
            ).length || 0,
        failedCount:
            paginatedResponse?.data?.filter(
                (p) =>
                    p.deploymentStatus?.status === "ERROR" ||
                    p.checksStatus?.conclusion === "failure"
            ).length || 0,
        readyCount:
            paginatedResponse?.data?.filter(
                (p) => p.deploymentStatus?.status === "READY"
            ).length || 0,
    };

    // === ЗАПРАШИВАЕМ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ===
    const { data: user, isLoading: isLoadingUser } = useSWR<UserProfile>(
        isAuthenticated ? "/users/me" : null,
        fetcher
    );

    const socket = useSocket();

    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(
        null
    );
    const [projectToLink, setProjectToLink] = useState<Project | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

    // состояние для отслеживания обновлений
    const [lastUpdatedProjectId, setLastUpdatedProjectId] = useState<
        string | null
    >(null);

    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

    // Находим активный проект в списке
    const activeProject = projects?.find((p) => p.id === activeProjectId);

    // Используем хук с действием onDelete
    useProjectHotkeys(activeProjectId, {
        onDelete: () => {
            if (activeProject) setProjectToDelete(activeProject);
        },
    });

    const mutateRef = useRef(mutate);
    useEffect(() => {
        mutateRef.current = mutate;
    }, [mutate]);

    // useEffect ДЛЯ ПРОСЛУШИВАНИЯ СОБЫТИЙ
    useEffect(() => {
        if (socket) {
            const handleProjectUpdate = (updatedProject: Project) => {
                console.log("Received project:updated event:", updatedProject);
                setLastUpdatedProjectId(updatedProject.id);

                // 1. Оптимистично обновляем основной список
                mutate((currentProjects) => {
                    if (!currentProjects) return [updatedProject];
                    return currentProjects.map((p) =>
                        p.id === updatedProject.id ? updatedProject : p
                    );
                }, false);

                // 2. ЯВНО ПЕРЕЗАГРУЖАЕМ КЭШ ДЛЯ ДОЧЕРНИХ КОМПОНЕНТОВ
                // Это заставит дочерние компоненты обновиться, если они используют эти ключи
                globalMutate(
                    `/integrations/github/checks/${updatedProject.id}`
                );
                globalMutate(
                    `/integrations/vercel/deployments/${updatedProject.id}`
                );

                toast.info(
                    `Status updated for project: ${updatedProject.name}`
                );
            };

            socket.on("project:updated", handleProjectUpdate);

            // Отписываемся от события при размонтировании
            return () => {
                socket.off("project:updated", handleProjectUpdate);
            };
        }
    }, [socket, mutate, globalMutate]);

    const handleLogout = () => {
        setToken(null);
        // Редирект произойдет автоматически благодаря useRequireAuth
    };

    const handleProjectAddedOrUpdated = () => {
        mutate();
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        const promise = api(`/projects/${projectToDelete.id}`, {
            method: "DELETE",
        });

        toast.promise(promise, {
            loading: "Deleting project...",
            success: () => {
                // Вместо ручного изменения стейта, мы оптимистично обновляем данные SWR
                mutate(
                    projects?.filter((p) => p.id !== projectToDelete.id),
                    false // Не делать ревалидацию, мы уже уверены в результате
                );
                setProjectToDelete(null); // Закрываем диалог
                return "Project deleted successfully!";
            },
            error: (err) => err.message || "Failed to delete project",
        });
    };

    // Пока идет проверка аутентификации, показываем заглушку
    if (isAuthLoading || !isAuthenticated) {
        return <AppLoader variant="connection" text="Authenticating..." />;
    }

    const isLoadingData = isLoadingProjects || isLoadingUser; // Общая загрузка

    // Основной интерфейс
    return (
        <div className="container mx-auto  p-4 md:p-8">
            <header className="relative z-10 flex flex-wrap md:flex-nowrap justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="flex w-full justify-between items-center mt-3 md:mt-0 gap-2 md:w-auto md:justify-start md:gap-4">
                    {/* ДОБАВЛЯЕМ ВИДЖЕТ СВОДКИ*/}
                    {projects && (
                        <DashboardSummary
                            totalProjects={summaryMetrics.totalProjects}
                            deployingCount={summaryMetrics.deployingCount}
                            failedCount={summaryMetrics.failedCount}
                            readyCount={summaryMetrics.readyCount}
                        />
                    )}
                    {projects && projects.length > 0 && (
                        <Button onClick={() => setIsImportDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Import Projects
                        </Button>
                    )}
                    {/* Кнопка, открывающая модальное окно */}
                    <Dialog
                        open={isDialogOpen || !!projectToEdit}
                        onOpenChange={(isOpen) => {
                            if (!isOpen) {
                                setIsDialogOpen(false);
                                setProjectToEdit(null);
                            }
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(true)}
                            >
                                Add Manually
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {projectToEdit
                                        ? "Edit Project"
                                        : "Add a new project"}
                                </DialogTitle>
                                <DialogDescription>
                                    {projectToEdit
                                        ? "Make changes to your project here. Click save when you are done."
                                        : "Enter the details of your project to start tracking deployments."}
                                </DialogDescription>
                            </DialogHeader>
                            <AddProjectForm
                                // Добавляем key. Если мы создаем проект, ключ будет 'create'.
                                // Если редактируем, ключ будет равен ID проекта.
                                key={
                                    projectToEdit ? projectToEdit.id : "create"
                                }
                                onProjectAdded={handleProjectAddedOrUpdated}
                                onProjectUpdated={handleProjectAddedOrUpdated}
                                projectToEdit={projectToEdit} // <-- Передаем данные для редактирования
                                onClose={() => {
                                    setIsDialogOpen(false);
                                    setProjectToEdit(null);
                                }}
                            />
                        </DialogContent>
                    </Dialog>

                    {/* Меню для мобильных устройств */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuPortal>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/profile"
                                            className="flex items-center w-full"
                                        >
                                            <UserCircle className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/settings"
                                            className="flex items-center w-full"
                                        >
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="text-red-500 focus:text-red-500"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log Out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenuPortal>
                        </DropdownMenu>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <UserCircle className="h-5 w-5" />
                                    <span className="sr-only">User Menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                        My Account
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/profile"
                                            className="cursor-pointer"
                                        >
                                            <UserCircle className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/settings"
                                            className="cursor-pointer"
                                        >
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="text-red-500 focus:text-red-500 cursor-pointer"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log Out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenuPortal>
                        </DropdownMenu>
                    </div>
                </div>
            </header>
            <main>
                <Card className="bg-card/80 border-white/10">
                    <CardHeader>
                        <CardTitle>My Projects</CardTitle>
                        <p className="text-gray-500 font-bold text-xs">
                            Note: Press del to remove the selected project from
                            the list
                        </p>
                    </CardHeader>
                    <CardContent>
                        {/* Этот скелетон для самой первой загрузки */}
                        {isLoadingProjects && !projects && (
                            <ProjectListSkeleton />
                        )}

                        {projectsError && !projects && (
                            <p className="text-red-500 text-center py-8">
                                Failed to load projects. Please try again later.
                            </p>
                        )}

                        {!isLoadingData &&
                            projects &&
                            user &&
                            (projects.length === 0 ? (
                                <div className="py-8">
                                    <OnboardingChecklist
                                        user={user}
                                        hasProjects={projects.length > 0}
                                        onImportClick={() =>
                                            setIsImportDialogOpen(true)
                                        }
                                    />
                                </div>
                            ) : (
                                <>
                                    <ul className="space-y-4">
                                        {projects.map((project) => (
                                            <ProjectListItem
                                                key={project.id}
                                                project={project}
                                                isLastUpdated={
                                                    lastUpdatedProjectId ===
                                                    project.id
                                                }
                                                onAnimationComplete={() =>
                                                    setLastUpdatedProjectId(
                                                        null
                                                    )
                                                }
                                                setProjectToEdit={
                                                    setProjectToEdit
                                                }
                                                setProjectToDelete={
                                                    setProjectToDelete
                                                }
                                                setProjectToLink={
                                                    setProjectToLink
                                                }
                                                setIsDialogOpen={
                                                    setIsDialogOpen
                                                }
                                                onMouseEnter={() =>
                                                    setActiveProjectId(
                                                        project.id
                                                    )
                                                }
                                                onMouseLeave={() =>
                                                    setActiveProjectId(null)
                                                }
                                            />
                                        ))}
                                    </ul>
                                    {/*  Добавляем компонент пагинации */}
                                    <PaginationControls
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </>
                            ))}
                    </CardContent>
                </Card>
            </main>
            <AlertDialog
                open={!!projectToDelete}
                onOpenChange={(isOpen) => !isOpen && setProjectToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete your project "{projectToDelete?.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProject}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <LinkVercelDialog
                projectToLink={projectToLink}
                onClose={() => setProjectToLink(null)}
                onLinked={handleProjectAddedOrUpdated}
            />

            <ImportVercelDialog
                isOpen={isImportDialogOpen}
                onClose={() => setIsImportDialogOpen(false)}
                onProjectImported={handleProjectAddedOrUpdated} // Он добавит проект в список
            />
        </div>
    );
}
