"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useRequireAuth } from "@/hooks/useRequireAuth"; // <-- ХУК
import { useAuth } from "@/contexts/AuthContext";
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
import { DashboardDeploymentStatus } from "@/components/DashboardDeploymentStatus.tsx";
import { ProjectListSkeleton } from "@/components/ProjectListSkeleton";
import { GithubChecksStatus } from "@/components/GithubChecksStatus";
import { ImportVercelDialog } from "@/components/ImportVercelDialog";

interface Project {
    id: string;
    name: string;
    gitUrl: string;
    vercelProjectId?: string | null;
}

export default function DashboardPage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useRequireAuth();

    const { setToken } = useAuth();
    const { api } = useApi();

    const [projects, setProjects] = useState<Project[]>([]);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(
        null
    );
    const [projectToLink, setProjectToLink] = useState<Project | null>(null);

    const [isLoadingData, setIsLoadingData] = useState(true);
    // Состояние для открытия/закрытия модального окна
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

    useEffect(() => {
        // Загружаем проекты, только если пользователь точно аутентифицирован
        if (isAuthenticated) {
            const fetchProjects = async () => {
                setIsLoadingData(true);
                try {
                    const data = await api("/projects");

                    setProjects(data);
                } catch (error: any) {
                    toast.error(`Failed to fetch projects: ${error.message}`);
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchProjects();
        }
    }, [isAuthenticated, api]);

    const handleLogout = () => {
        setToken(null);
        // Редирект произойдет автоматически благодаря useRequireAuth
    };

    const handleProjectAdded = (newProject: Project) => {
        // Перед добавлением проверяем, нет ли уже проекта с таким ID в списке
        setProjects((currentProjects) => {
            if (currentProjects.some((p) => p.id === newProject.id)) {
                return currentProjects; // Если есть - ничего не меняем
            }
            return [...currentProjects, newProject]; // Если нет - добавляем
        });
    };

    const handleProjectUpdated = (updatedProject: Project) => {
        setProjects((currentProjects) =>
            currentProjects.map((p) =>
                p.id === updatedProject.id ? updatedProject : p
            )
        );
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        const promise = api(`/projects/${projectToDelete.id}`, {
            method: "DELETE",
        });

        toast.promise(promise, {
            loading: "Deleting project...",
            success: () => {
                // Удаляем проект из списка на клиенте
                setProjects((projects) =>
                    projects.filter((p) => p.id !== projectToDelete.id)
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
                    {projects.length > 0 && (
                        <Button onClick={() => setIsImportDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New
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
                            <Button onClick={() => setIsDialogOpen(true)}>
                                Add New Project
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
                                onProjectAdded={handleProjectAdded}
                                onProjectUpdated={handleProjectUpdated}
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
                        {isLoadingData ? (
                            <ProjectListSkeleton />
                        ) : projects.length > 0 ? (
                            <ul className="space-y-4">
                                {projects.map((project) => (
                                    <li
                                        key={project.id}
                                        className="flex flex-wrap items-center justify-between rounded-lg border p-4"
                                    >
                                        <Link
                                            href={`/project/${project.id}`}
                                            className="flex-grow"
                                        >
                                            <div>
                                                <p className="font-semibold text-lg hover:underline">
                                                    {project.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {project.gitUrl}
                                                </p>
                                            </div>
                                        </Link>

                                        <div className="flex flex-wrap items-center gap-2 pl-0 md:pl-4">
                                            <GithubChecksStatus
                                                projectId={project.id}
                                                gitUrl={project.gitUrl}
                                            />
                                            {project.vercelProjectId ? (
                                                // Если проект связан, показываем компонент статуса
                                                <DashboardDeploymentStatus
                                                    projectId={project.id}
                                                />
                                            ) : (
                                                // Иначе показываем кнопку "Link"
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // <-- Останавливаем "всплытие" клика
                                                        setProjectToLink(
                                                            project
                                                        );
                                                    }}
                                                >
                                                    Link to Vercel
                                                </Button>
                                            )}

                                            {/* ВЫПАДАЮЩЕЕ МЕНЮ */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
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
                        ) : (
                            // === БЛОК ДЛЯ ПУСТОГО СОСТОЯНИЯ ===
                            <div className="text-center py-12">
                                <h3 className="font-semibold text-lg">
                                    No projects found
                                </h3>
                                <p className="text-muted-foreground mt-1 mb-4">
                                    Get started by importing your projects from
                                    Vercel.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsImportDialogOpen(true)}
                                >
                                    Import from Vercel
                                </Button>
                            </div>
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
                onLinked={handleProjectUpdated}
            />

            <ImportVercelDialog
                isOpen={isImportDialogOpen}
                onClose={() => setIsImportDialogOpen(false)}
                onProjectImported={handleProjectAdded} // Он добавит проект в список
                existingProjects={projects} // Передаем, чтобы отфильтровать уже добавленные
            />
        </div>
    );
}
