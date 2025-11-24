import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface DraggableTeacherProps {
    id: string;
    name: string;
    isOverlay?: boolean;
    disabled?: boolean;
    count?: number;
}

export const DraggableTeacher: React.FC<DraggableTeacherProps> = ({ id, name, isOverlay, disabled, count }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: id,
        data: { name },
        disabled: disabled,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    const baseClasses = "px-2 py-1 text-xs rounded border shadow-sm select-none truncate max-w-full flex justify-between items-center gap-2";
    const stateClasses = disabled
        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
        : "bg-blue-100 text-blue-800 border-blue-200 cursor-grab active:cursor-grabbing hover:bg-blue-200";

    const draggingClasses = isDragging ? "opacity-50" : "";
    const overlayClasses = isOverlay ? "z-50 shadow-xl scale-105" : "";

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`${baseClasses} ${stateClasses} ${draggingClasses} ${overlayClasses}`}
            title={name}
        >
            <span className="truncate">{name}</span>
            {count !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${disabled ? 'bg-gray-200 text-gray-500' : 'bg-blue-200 text-blue-700'}`}>
                    {count}/3
                </span>
            )}
        </div>
    );
};
