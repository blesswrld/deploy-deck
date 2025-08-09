"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface VercelProject {
    id: string;
    name: string;
    framework: string;
}

interface LinkVercelDialogProps {
    projectToLink: { id: string; name: string } | null;
    onClose: () => void;
    onLinked: (updatedProject: any) => void;
}

export function LinkVercelDialog({
    projectToLink,
    onClose,
    onLinked,
}: LinkVercelDialogProps) {
    const { api } = useApi();
    const [vercelProjects, setVercelProjects] = useState<VercelProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (projectToLink) {
            api("/integrations/vercel/projects")
                .then(setVercelProjects)
                .catch((err) => toast.error(err.message))
                .finally(() => setIsLoading(false));
        }
    }, [projectToLink, api]);

    const handleLink = (vercelProjectId: string) => {
        if (!projectToLink) return;

        const promise = api(`/projects/${projectToLink.id}/link-vercel`, {
            method: "PATCH",
            body: JSON.stringify({ vercelProjectId }),
        });

        toast.promise(promise, {
            loading: "Linking project...",
            success: (updatedProject) => {
                onLinked(updatedProject);
                onClose();
                return "Project linked successfully!";
            },
            error: (err) => err.message,
        });
    };

    return (
        <Dialog open={!!projectToLink} onOpenChange={onClose}>
            <DialogContent className="max-w-[90vw] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Link "{projectToLink?.name}" to a Vercel Project
                    </DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <p>Loading Vercel projects...</p>
                ) : (
                    <div
                        className="max-h-60 overflow-y-auto space-y-2 pr-2
                         scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                    >
                        {vercelProjects.map((vercelProject) => (
                            <div
                                key={vercelProject.id}
                                className="flex justify-between items-center p-2 border rounded-md"
                            >
                                <div>
                                    <p className="font-medium">
                                        {vercelProject.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {vercelProject.framework}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleLink(vercelProject.id)}
                                >
                                    Link
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
