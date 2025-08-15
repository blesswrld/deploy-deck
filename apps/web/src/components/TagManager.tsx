"use client";

import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import useSWR from "swr";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "./ui/command";
import { Button } from "./ui/button";
import { Check, PlusCircle, Tag as TagIcon, Trash2 } from "lucide-react";
import { Input } from "./ui/input";
import { HexColorPicker as ColorPicker } from "react-colorful";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

interface Tag {
    id: string;
    name: string;
    color: string;
}

interface Project {
    id: string;
    tags: Tag[];
}

interface TagManagerProps {
    project: Project;
}

export const TagManager = ({ project }: TagManagerProps) => {
    const { api } = useApi();
    const fetcher = (url: string) => api(url);
    const { data: allTags, mutate: mutateTags } = useSWR<Tag[]>(
        "/tags",
        fetcher
    );
    const { mutate: mutateProjects } = useSWRConfig();

    const [newTagName, setNewTagName] = useState("");
    const [newTagColor, setNewTagColor] = useState("#ffffff");

    const projectTagIds = new Set(project.tags.map((tag) => tag.id));

    const handleTagToggle = (tag: Tag) => {
        const isTagged = projectTagIds.has(tag.id);
        const url = `/projects/${project.id}/tags${isTagged ? `/${tag.id}` : ""}`;
        const method = isTagged ? "DELETE" : "POST";

        const promise = api(url, {
            method,
            body: isTagged ? undefined : JSON.stringify({ tagId: tag.id }),
        });

        toast.promise(promise, {
            loading: "Updating tags...",
            success: () => {
                mutateProjects("/projects");
                return "Tags updated successfully!";
            },
            error: (err) => err.message,
        });
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        const promise = api("/tags", {
            method: "POST",
            body: JSON.stringify({ name: newTagName, color: newTagColor }),
        });

        toast.promise(promise, {
            loading: "Creating tag...",
            success: (newTag) => {
                mutateTags();
                handleTagToggle(newTag); // Сразу добавляем к проекту
                setNewTagName("");
                return "Tag created and added!";
            },
            error: (err) => err.message,
        });
    };

    const handleTagDelete = (tagId: string) => {
        const promise = api(`/tags/${tagId}`, { method: "DELETE" });

        toast.promise(promise, {
            loading: "Deleting tag...",
            success: () => {
                mutateTags();
                mutateProjects("/projects");
                return "Tag deleted successfully.";
            },
            error: (err) => err.message,
        });
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start p-2 h-auto gap-2"
                >
                    <TagIcon className="h-4 w-4" />
                    <span>Tags</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
                <Command>
                    <CommandInput placeholder="Search or create tag..." />
                    <CommandList>
                        <CommandEmpty>No tags found.</CommandEmpty>
                        <CommandGroup heading="Available Tags">
                            {allTags?.map((tag) => (
                                <CommandItem
                                    key={tag.id}
                                    onSelect={() => handleTagToggle(tag)}
                                    className="flex justify-between items-center"
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{
                                                backgroundColor: tag.color,
                                            }}
                                        />
                                        <span>{tag.name}</span>
                                        {projectTagIds.has(tag.id) && (
                                            <Check className="h-4 w-4 ml-auto" />
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-50 hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleTagDelete(tag.id);
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3 text-red-500" />
                                    </Button>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
                <div className="p-2 border-t">
                    <p className="text-xs font-semibold mb-2">Create New Tag</p>
                    <div className="flex items-center gap-2">
                        <Input
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="New tag name"
                            className="h-8"
                        />
                        <Button
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleCreateTag}
                        >
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="mt-2 flex justify-center">
                        <ColorPicker
                            color={newTagColor}
                            onChange={setNewTagColor}
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
