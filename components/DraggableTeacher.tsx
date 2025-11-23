import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface DraggableTeacherProps {
    id: string;
    name: string;
    isOverlay?: boolean;
}

export const DraggableTeacher: React.FC<DraggableTeacherProps> = ({ id, name, isOverlay }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: id,
        data: { name },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    const baseClasses = "px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200 cursor-grab active:cursor-grabbing shadow-sm select-none truncate max-w-full";
    const draggingClasses = isDragging ? "opacity-50" : "";
    const overlayClasses = isOverlay ? "z-50 shadow-xl scale-105" : "";

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`${baseClasses} ${draggingClasses} ${overlayClasses}`}
            title={name}
        >
            {name}
        </div>
    );
};
