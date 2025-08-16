"use client";

import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
}: PaginationControlsProps) => {
    if (totalPages <= 1) {
        return null; // Не показываем пагинацию, если страница всего одна
    }

    return (
        <div className="flex items-center justify-center gap-4 mt-8">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
            >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
            </Button>
            <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
            >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
        </div>
    );
};
