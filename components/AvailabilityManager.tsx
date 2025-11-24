```typescript
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

import { TeacherSchedule, StandbyAssignment, TeacherExclusion } from '../types';
import { StandbyGrid } from './StandbyGrid';
import { DraggableTeacher } from './DraggableTeacher';
import { generateStandbySchedule } from '../services/availabilityService';
import { ExclusionModal } from './ExclusionModal';

interface AvailabilityManagerProps {
    schedules: TeacherSchedule[];
}

export const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({ schedules }) => {
    const [assignments, setAssignments] = useState<StandbyAssignment[]>([]);
    const assignmentsRef = React.useRef(assignments);
    
    useEffect(() => {
        assignmentsRef.current = assignments;
    }, [assignments]);

    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Exclusion state
    const [exclusions, setExclusions] = useState<TeacherExclusion[]>([]);
    const [editingTeacher, setEditingTeacher] = useState<string | null>(null);

    // Load saved exclusions
    useEffect(() => {
        try {
            const savedExclusions = localStorage.getItem('khlista_exclusions');
            if (savedExclusions) {
                setExclusions(JSON.parse(savedExclusions));
            }
        } catch (e) {
            console.error("Failed to load exclusions", e);
        }
    }, []);

    // Save exclusions
    useEffect(() => {
        localStorage.setItem('khlista_exclusions', JSON.stringify(exclusions));
    }, [exclusions]);

    // Save selected teachers
    useEffect(() => {
        if (selectedTeachers.length > 0) {
            localStorage.setItem('khlista_selected_teachers', JSON.stringify(selectedTeachers));
        }
    }, [selectedTeachers]);

    // Initialize selected teachers
    useEffect(() => {
        if (schedules.length > 0) {
            const savedSelection = localStorage.getItem('khlista_selected_teachers');
            if (savedSelection) {
                try {
                    const parsed = JSON.parse(savedSelection);
                    // Filter to ensure we only keep teachers that are actually in the current schedules
                    const validSelection = parsed.filter((name: string) => schedules.some(s => s.name === name));
                    
                    // If we have a valid selection, use it. 
                    // If the valid selection is empty (e.g. new file loaded with different teachers), 
                    // fall back to selecting all.
                    if (validSelection.length > 0) {
                        setSelectedTeachers(validSelection);
                        return;
                    }
                } catch (e) {
                    console.error("Failed to load selected teachers", e);
                }
            }
            // Default: select all
            setSelectedTeachers(schedules.map(t => t.name));
        }
    }, [schedules]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleGenerate = () => {
        const newAssignments = generateStandbySchedule(selectedTeachers, schedules, [], exclusions);
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
        const isGridCell = overIdString.includes('-');

        if (isGridCell) {
            const [day, periodStr] = overIdString.split('-');
            const period = parseInt(periodStr, 10);

            let teacherName = '';
            let isNewAssignment = false;

            // Use ref to get latest assignments for validation
            const currentAssignments = assignmentsRef.current;
            const existingAssignment = currentAssignments.find(a => a.id === activeIdString);

            if (existingAssignment) {
                teacherName = existingAssignment.teacherName;
            } else {
                teacherName = activeIdString;
                isNewAssignment = true;
            }

            // Validate exclusion
            if (exclusions.some(e => e.teacherName === teacherName && e.day === day && e.period === period)) {
                alert(`${ teacherName } számára ez az időpont tiltva van!`);
                return;
            }

            // Prevent duplicate in same slot
            if (currentAssignments.some(a => a.teacherName === teacherName && a.day === day && a.period === period && a.id !== activeIdString)) {
                 // If moving the same assignment to the same slot, it's fine (though no-op). 
                 // But if dragging a NEW one, or a DIFFERENT existing one, block it.
                 // The check `a.id !== activeIdString` ensures we don't block ourselves when moving (though moving to same slot is trivial).
                 // But for new assignment, activeIdString is name, a.id is unique ID. They won't match. So it blocks.
                 return;
            }

            if (isNewAssignment) {
                // Check weekly quota
                const currentCount = currentAssignments.filter(a => a.teacherName === teacherName).length;
                console.log(`Checking quota for ${ teacherName }: current = ${ currentCount } `);
                if (currentCount >= 3) {
                    alert(`${ teacherName } már elérte a heti 3 alkalmas limitet!`);
                    return;
                }

                const newAssignment: StandbyAssignment = {
                    id: `${ teacherName } -${ day } -${ period } -${ Date.now() } `,
                    teacherName,
                    day,
                    period
                };
                setAssignments(prev => [...prev, newAssignment]);
            } else {
                setAssignments(prev => prev.map(a => {
                    if (a.id === activeIdString) {
                        return { ...a, day, period };
                    }
                    return a;
                }));
            }
        } else if (overIdString === 'sidebar-droppable') {
            setAssignments(prev => prev.filter(a => a.id !== activeIdString));
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

    const handleToggleExclusion = (day: string, period: number) => {
        if (!editingTeacher) return;

        setExclusions(prev => {
            const exists = prev.some(e => e.teacherName === editingTeacher && e.day === day && e.period === period);
            if (exists) {
                return prev.filter(e => !(e.teacherName === editingTeacher && e.day === day && e.period === period));
            } else {
                return [...prev, { teacherName: editingTeacher, day, period }];
            }
        });
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
                <div className={`bg - white border - r border - gray - 200 transition - all duration - 300 flex flex - col ${ isSidebarOpen ? 'w-80' : 'w-12' } `}>
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
                               {schedules.map(teacher => {
                                   const currentCount = assignments.filter(a => a.teacherName === teacher.name).length;
                                   const isQuotaReached = currentCount >= 3;
                                   
                                   return (
                                       <div key={teacher.name} className="flex items-center justify-between group p-1 hover:bg-gray-50 rounded border border-transparent hover:border-gray-200">
                                           <div className="flex items-center space-x-2 overflow-hidden flex-1 min-w-0 mr-2">
                                               <input 
                                                 type="checkbox" 
                                                 checked={selectedTeachers.includes(teacher.name)}
                                                 onChange={() => toggleTeacherSelection(teacher.name)}
                                                 className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300 flex-shrink-0"
                                               />
                                               <div className="truncate flex-1 min-w-0">
                                                    <DraggableTeacher 
                                                        id={teacher.name} 
                                                        name={teacher.name} 
                                                        disabled={isQuotaReached}
                                                        count={currentCount}
                                                    />
                                               </div>
                                           </div>
                                           <button
                                             onClick={() => setEditingTeacher(teacher.name)}
                                             className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md flex-shrink-0 border border-gray-200 bg-white shadow-sm transition-all"
                                             title="Kizárások beállítása"
                                           >
                                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                             </svg>
                                           </button>
                                       </div>
                                   );
                               })}
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

            {editingTeacher && (
                <ExclusionModal
                    isOpen={!!editingTeacher}
                    onClose={() => setEditingTeacher(null)}
                    teacherName={editingTeacher}
                    exclusions={exclusions.filter(e => e.teacherName === editingTeacher)}
                    onToggleExclusion={handleToggleExclusion}
                />
            )}
        </DndContext>
    );
};
```
