"use client";

import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import useSWR from "swr"; // <-- ВАЖНЫЙ ИМПОРТ
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
    MoreHorizontal,
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
import DashboardDeploymentStatus from "@/components/DashboardDeploymentStatus";
import { ProjectListSkeleton } from "@/components/ProjectListSkeleton";
import GithubChecksStatus from "@/components/GithubChecksStatus";
import { ImportVercelDialog } from "@/components/ImportVercelDialog";

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

    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(
        null
    );
    const [projectToLink, setProjectToLink] = useState<Project | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

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
        return (
            <div className="flex items-center justify-center min-h-screen">
                Authenticating...
            </div>
        );
    }

    // Основной интерфейс
    return (
        <div className="container mx-auto  p-4 md:p-8">
            <header className="flex flex-wrap md:flex-nowrap justify-between items-center mb-8">
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
                <Card>
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
                                <ul className="space-y-4">
                                    {projects.map((project) => (
                                        <li
                                            key={project.id}
                                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 gap-4"
                                        >
                                            <Link
                                                href={`/project/${project.id}`}
                                                className="flex-grow w-full sm:w-auto"
                                            >
                                                <div>
                                                    <p className="font-semibold text-lg hover:underline">
                                                        {project.name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {project.gitUrl}
                                                    </p>
                                                </div>
                                            </Link>

                                            <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-4">
                                                <div className="flex items-center gap-4">
                                                    <GithubChecksStatus
                                                        checksStatus={
                                                            project.checksStatus
                                                        }
                                                    />
                                                    {project.vercelProjectId ? (
                                                        <DashboardDeploymentStatus
                                                            deploymentStatus={
                                                                project.deploymentStatus
                                                            }
                                                        />
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setProjectToLink(
                                                                    project
                                                                );
                                                            }}
                                                        >
                                                            Link to Vercel
                                                        </Button>
                                                    )}
                                                </div>
                                                {/* ВЫПАДАЮЩЕЕ МЕНЮ */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <span className="sr-only">
                                                                Open menu
                                                            </span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>
                                                            Actions
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setProjectToEdit(
                                                                    project
                                                                ); // <-- Сохраняем проект для редактирования
                                                                setIsDialogOpen(
                                                                    true
                                                                );
                                                            }}
                                                        >
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() =>
                                                                setProjectToDelete(
                                                                    project
                                                                )
                                                            } // <-- Устанавливаем проект для удаления
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
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
