"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GitBranch, GitCommitHorizontal, MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { GithubLogo } from "@/components/ui/icons";
import GithubChecksStatus from "@/components/GithubChecksStatus";
import DashboardDeploymentStatus from "@/components/DashboardDeploymentStatus";
import { TagBadge } from "./TagBadge";
import { TagManager } from "./TagManager";

// Определения типов, необходимые для этого компонента
interface Project {
    id: string;
    name: string;
    gitUrl: string;
    vercelProjectId?: string | null;
    deploymentStatus: any;
    checksStatus: any;
    tags: { id: string; name: string; color: string }[];
}

interface ProjectListItemProps {
    project: Project;
    // isLastUpdated и onAnimationComplete больше не нужны
    setProjectToEdit: (project: Project | null) => void;
    setProjectToDelete: (project: Project | null) => void;
    setProjectToLink: (project: Project | null) => void;
    setIsDialogOpen: (isOpen: boolean) => void;
    onMouseEnter: () => void; // <-- ПРОП для биндов
    onMouseLeave: () => void; // <-- ПРОП для биндов
}

export const ProjectListItem = ({
    project,
    setProjectToEdit,
    setProjectToDelete,
    setProjectToLink,
    setIsDialogOpen,
    onMouseEnter,
    onMouseLeave,
}: ProjectListItemProps) => {
    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    console.log(`--- RENDERING ProjectListItem for ${project.name} ---`, {
        status: project.deploymentStatus?.status,
    });

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <motion.li
            variants={itemVariants}
            whileHover={{ scale: 1.015 }}
            onMouseEnter={onMouseEnter} // <-- Вешаем обработчик
            onMouseLeave={onMouseLeave} // <-- Вешаем обработчик
            className="flex flex-col rounded-lg border bg-card/85 border-white/10"
        >
            {/* Верхняя часть: Название и Меню */}
            <div className="flex items-center justify-between p-4">
                <Link
                    href={`/project/${project.id}`}
                    className="flex-grow min-w-0"
                >
                    <div>
                        <p className="font-semibold text-lg hover:underline truncate">
                            {project.name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                            {project.gitUrl}
                        </p>
                        {/* === ОТОБРАЖЕНИЕ ТЕГОВ === */}
                        {project.tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-2">
                                {project.tags.map((tag) => (
                                    <TagBadge key={tag.id} tag={tag} />
                                ))}
                            </div>
                        )}
                    </div>
                </Link>
                <div className="pl-4">
                    {/* ВЫПАДАЮЩЕЕ МЕНЮ С РУЧНЫМ УПРАВЛЕНИЕМ */}
                    <DropdownMenu
                        open={isMenuOpen}
                        onOpenChange={setIsMenuOpen}
                    >
                        <TagManager project={project} />

                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuContent
                                align="end"
                                // Предотвращаем автоматическое закрытие при потере фокуса
                                onFocusOutside={(e) => e.preventDefault()}
                                // Закрываем вручную, если курсор ушел и от меню, и от поповера
                                onPointerLeave={() => {
                                    // Небольшая задержка, чтобы успеть переместить курсор
                                    setTimeout(() => {
                                        const popover = document.querySelector(
                                            "[data-radix-popper-content-wrapper]"
                                        );
                                        if (
                                            !popover ||
                                            !popover.matches(":hover")
                                        ) {
                                            setIsMenuOpen(false);
                                        }
                                    }, 100);
                                }}
                            >
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => {
                                        setProjectToEdit(project);
                                        setIsDialogOpen(true);
                                    }}
                                >
                                    Edit
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => setProjectToDelete(project)}
                                >
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenuPortal>
                    </DropdownMenu>
                </div>
            </div>

            {/* Нижняя часть: Статусы */}
            <div className="flex flex-wrap items-center justify-between border-t border-white/10 px-4 py-2 gap-y-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <GithubLogo className="h-4 w-4" />
                        <GithubChecksStatus
                            checksStatus={project.checksStatus}
                        />
                    </div>
                    {project.vercelProjectId ? (
                        <DashboardDeploymentStatus
                            deploymentStatus={project.deploymentStatus}
                        />
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                setProjectToLink(project);
                            }}
                        >
                            Link to Vercel
                        </Button>
                    )}
                </div>
                {project.deploymentStatus?.branch && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            <span>{project.deploymentStatus.branch}</span>
                        </div>
                        {project.deploymentStatus?.commit && (
                            <div className="flex items-center gap-1">
                                <GitCommitHorizontal className="h-3 w-3" />
                                <span className="font-mono">
                                    {project.deploymentStatus.commit}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.li>
    );
};
