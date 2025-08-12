"use client";

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

// Определения типов, необходимые для этого компонента
interface Project {
    id: string;
    name: string;
    gitUrl: string;
    vercelProjectId?: string | null;
    deploymentStatus: any;
    checksStatus: any;
}

interface ProjectListItemProps {
    project: Project;
    isLastUpdated: boolean;
    onAnimationComplete: () => void;
    setProjectToEdit: (project: Project | null) => void;
    setProjectToDelete: (project: Project | null) => void;
    setProjectToLink: (project: Project | null) => void;
    setIsDialogOpen: (isOpen: boolean) => void;
}

export const ProjectListItem = ({
    project,
    isLastUpdated,
    onAnimationComplete,
    setProjectToEdit,
    setProjectToDelete,
    setProjectToLink,
    setIsDialogOpen,
}: ProjectListItemProps) => {
    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    const highlightVariants = {
        initial: {
            boxShadow: "0 0 0 0px hsla(210, 100%, 50%, 0)",
            borderColor: "hsla(217, 32.6%, 17.5%, 1)",
        },
        highlight: {
            boxShadow: "0 0 0 2px hsla(210, 100%, 50%, 0.5)",
            borderColor: "hsla(210, 100%, 50%, 0.5)",
            transition: {
                duration: 0.5,
                ease: "easeOut",
                repeat: 1,
                repeatType: "reverse",
            },
        },
    };

    return (
        <motion.li
            variants={{ ...itemVariants, ...highlightVariants }}
            animate={isLastUpdated ? "highlight" : "initial"}
            onAnimationComplete={onAnimationComplete}
            whileHover={{ scale: 1.015 }}
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
                    </div>
                </Link>
                <div className="pl-4">
                    {/* ВЫПАДАЮЩЕЕ МЕНЮ */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuContent align="end">
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
