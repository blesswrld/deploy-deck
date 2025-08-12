"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion"; // <-- Импорт для анимации
import { useSocket } from "@/contexts/SocketContext";
import { useApi } from "@/hooks/useApi";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import useSWR from "swr";
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

interface Project {
    id: string;
    name: string;
    gitUrl: string;
    vercelProjectId?: string | null;
    deploymentStatus: any; // Используем any для простоты
    checksStatus: any;
}

export default function DashboardPage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useRequireAuth();
    const { setToken } = useAuth();
    const { api } = useApi();

    // --- ЕДИНСТВЕННЫЙ ИСТОЧНИК ДАННЫХ О ПРОЕКТАХ ---
    const fetcher = (url: string) => api(url);
    const {
        data: projects,
        error,
        isLoading: isLoadingData,
        mutate,
    } = useSWR<Project[]>(isAuthenticated ? "/projects" : null, fetcher, {
        refreshInterval: 15000,
        onError: (err) => {
            toast.error(`Failed to fetch projects: ${err.message}`);
        },
    });

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

    // useEffect ДЛЯ ПРОСЛУШИВАНИЯ СОБЫТИЙ
    useEffect(() => {
        if (socket) {
            // Подписываемся на событие 'project:updated'
            socket.on("project:updated", (updatedProject: Project) => {
                console.log("Received project:updated event:", updatedProject);

                // Устанавливаем ID обновленного проекта
                setLastUpdatedProjectId(updatedProject.id);

                // Используем mutate для обновления кэша SWR
                mutate((currentProjects) => {
                    if (!currentProjects) return [];
                    // Находим и заменяем обновленный проект в списке
                    return currentProjects.map((p) =>
                        p.id === updatedProject.id ? updatedProject : p
                    );
                }, false); // `false` предотвращает немедленный повторный запрос

                toast.info(
                    `Status updated for project: ${updatedProject.name}`
                );
            });

            // Отписываемся от события при размонтировании
            return () => {
                socket.off("project:updated");
            };
        }
    }, [socket, mutate]);

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

    // Основной интерфейс
    return (
        <div className="container mx-auto  p-4 md:p-8">
            <header className="relative z-10 flex flex-wrap md:flex-nowrap justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Your Dashboard</h1>
                <div className="flex w-full justify-between items-center mt-3 md:mt-0 gap-2 md:w-auto md:justify-start md:gap-4">
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
                        <Link href="/profile">
                            <Button variant="ghost" size="icon">
                                <UserCircle className="h-5 w-5" />
                                <span className="sr-only">Profile</span>
                            </Button>
                        </Link>
                        <Link href="/settings">
                            <Button variant="ghost" size="icon">
                                <Settings className="h-5 w-5" />
                                <span className="sr-only">Settings</span>
                            </Button>
                        </Link>
                        <Button onClick={handleLogout} variant="outline">
                            Log Out
                        </Button>
                    </div>
                </div>
            </header>
            <main>
                <Card className="bg-card/80 border-white/10">
                    <CardHeader>
                        <CardTitle>My Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingData && <ProjectListSkeleton />}

                        {error && (
                            <p className="text-red-500 text-center py-8">
                                Failed to load projects. Please try again later.
                            </p>
                        )}

                        {!isLoadingData &&
                            !error &&
                            projects &&
                            projects.length === 0 && (
                                <div className="text-center py-12">
                                    <h3 className="font-semibold text-lg">
                                        No projects found
                                    </h3>
                                    <p className="text-muted-foreground mt-1 mb-4">
                                        Get started by importing your projects
                                        from Vercel.
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setIsImportDialogOpen(true)
                                        }
                                    >
                                        Import from Vercel
                                    </Button>
                                </div>
                            )}

                        {!isLoadingData &&
                            !error &&
                            projects &&
                            projects.length > 0 && (
                                <motion.ul
                                    className="space-y-4"
                                    variants={{
                                        visible: {
                                            transition: {
                                                staggerChildren: 0.05,
                                            },
                                        },
                                    }}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {projects.map((project) => (
                                        <ProjectListItem
                                            key={project.id}
                                            project={project}
                                            isLastUpdated={
                                                lastUpdatedProjectId ===
                                                project.id
                                            }
                                            onAnimationComplete={() =>
                                                setLastUpdatedProjectId(null)
                                            }
                                            setProjectToEdit={setProjectToEdit}
                                            setProjectToDelete={
                                                setProjectToDelete
                                            }
                                            setProjectToLink={setProjectToLink}
                                            setIsDialogOpen={setIsDialogOpen}
                                        />
                                    ))}
                                </motion.ul>
                            )}
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
