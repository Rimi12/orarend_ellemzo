import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent
} from '@dnd-kit/core';
import {
    sortableKeyboardCoordinates
} from '@dnd-kit/sortable';

import { TeacherSchedule, StandbyAssignment } from '../types';
import { StandbyGrid } from './StandbyGrid';
import { DraggableTeacher } from './DraggableTeacher';
import { generateStandbySchedule } from '../services/availabilityService';

interface AvailabilityManagerProps {
    schedules: TeacherSchedule[];
}

export const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({ schedules }) => {
    const [assignments, setAssignments] = useState<StandbyAssignment[]>([]);
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Initialize selected teachers with all teachers when schedules load
    useEffect(() => {
        if (schedules.length > 0 && selectedTeachers.length === 0) {
            setSelectedTeachers(schedules.map(t => t.name));
        }
    }, [schedules]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleGenerate = () => {
        const newAssignments = generateStandbySchedule(selectedTeachers, schedules, []);
        setAssignments(newAssignments);
    };

    const handleClear = () => {
        setAssignments([]);
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeIdString = active.id as string;
        const overIdString = over.id as string;

        // Check if dropped on a grid cell
        // Grid cell IDs are formatted as "Day-Period" (e.g., "Hétfő-1")
        const isGridCell = overIdString.includes('-');

        if (isGridCell) {
            const [day, periodStr] = overIdString.split('-');
            const period = parseInt(periodStr, 10);

            // Find the teacher name. 
            // If dragging from sidebar, ID is the name.
            // If dragging from grid, ID is the assignment ID.
            let teacherName = '';
            let isNewAssignment = false;

            const existingAssignment = assignments.find(a => a.id === activeIdString);

            if (existingAssignment) {
                teacherName = existingAssignment.teacherName;
            } else {
                // Dragged from sidebar (assuming sidebar IDs are teacher names)
                teacherName = activeIdString;
                isNewAssignment = true;
            }

            if (isNewAssignment) {
                // Create new assignment
                const newAssignment: StandbyAssignment = {
                    id: `${teacherName}-${day}-${period}-${Date.now()}`,
                    teacherName,
                    day,
                    period
                };
                setAssignments([...assignments, newAssignment]);
            } else {
                // Move existing assignment
                setAssignments(assignments.map(a => {
                    if (a.id === activeIdString) {
                        return { ...a, day, period };
                    }
                    return a;
                }));
            }
        } else if (overIdString === 'sidebar-droppable') {
            // Dropped back to sidebar -> Remove assignment
            setAssignments(assignments.filter(a => a.id !== activeIdString));
        }
    };

    const toggleTeacherSelection = (name: string) => {
        setSelectedTeachers(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    const getTeacherNameFromId = (id: string) => {
        const assignment = assignments.find(a => a.id === id);
        return assignment ? assignment.teacherName : id;
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-[calc(100vh-200px)]">
                {/* Sidebar */}
                <div className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-12'}`}>
                    <div className="p-2 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        {isSidebarOpen && <h3 className="font-semibold text-gray-700">Tanárok</h3>}
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-gray-200 rounded">
                            {isSidebarOpen ? '◀' : '▶'}
                        </button>
                    </div>

                    {isSidebarOpen && (
                        <div className="flex-1 overflow-y-auto p-2">
                            <div className="mb-4 space-y-2">
                                <button
                                    onClick={handleGenerate}
                                    className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
                                >
                                    Automatikus Kiosztás
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="w-full py-2 px-4 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-medium"
                                >
                                    Törlés
                                </button>
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Elérhető Tanárok</div>
                                {schedules.map(teacher => (
                                    <div key={teacher.name} className="flex items-center justify-between group">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedTeachers.includes(teacher.name)}
                                                onChange={() => toggleTeacherSelection(teacher.name)}
                                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                                            />
                                            <DraggableTeacher id={teacher.name} name={teacher.name} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto bg-gray-50 p-4">
                    <div className="bg-white rounded-lg shadow p-4 min-h-full">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Rendelkezésre állás beosztás</h2>
                        <StandbyGrid assignments={assignments} />
                    </div>
                </div>
            </div>

            <DragOverlay>
                {activeId ? (
                    <DraggableTeacher
                        id={activeId}
                        name={getTeacherNameFromId(activeId)}
                        isOverlay
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};
