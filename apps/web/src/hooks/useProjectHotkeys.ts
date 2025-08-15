import { useEffect } from "react";

// onDelete
interface HotkeyActions {
    onDelete: () => void;
}

export const useProjectHotkeys = (
    activeProjectId: string | null,
    actions: HotkeyActions
) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                !activeProjectId ||
                (event.target as HTMLElement).tagName === "INPUT"
            ) {
                return;
            }

            // case для 'delete'
            if (event.key.toLowerCase() === "delete") {
                event.preventDefault();
                actions.onDelete();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [activeProjectId, actions]);
};
