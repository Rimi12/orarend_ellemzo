import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { StandbyAssignment } from '../types';
import { DraggableTeacher } from './DraggableTeacher';

interface DroppableCellProps {
    day: string;
    period: number;
    assignments: StandbyAssignment[];
}

const DroppableCell: React.FC<DroppableCellProps> = ({ day, period, assignments }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `${day}-${period}`,
        data: { day, period },
    });

    return (
        <div
            ref={setNodeRef}
            className={`h-24 p-1 border border-gray-200 transition-colors duration-200 overflow-y-auto ${isOver ? 'bg-blue-50 border-blue-300' : 'bg-white'
                }`}
        >
            <div className="flex flex-wrap gap-1">
                {assignments.map((assignment) => (
                    <DraggableTeacher
                        key={assignment.id}
                        id={assignment.id}
                        name={assignment.teacherName}
                    />
                ))}
            </div>
        </div>
    );
};

interface StandbyGridProps {
    assignments: StandbyAssignment[];
}

const DAYS = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export const StandbyGrid: React.FC<StandbyGridProps> = ({ assignments }) => {
    return (
        <div className="overflow-x-auto">
            <div className="min-w-[800px]">
                <div className="grid grid-cols-[50px_repeat(5,_1fr)] gap-0 border-t border-l border-gray-200">
                    {/* Header Row */}
                    <div className="bg-gray-100 p-2 font-bold text-center border-b border-r border-gray-200">
                        #
                    </div>
                    {DAYS.map((day) => (
                        <div key={day} className="bg-gray-100 p-2 font-bold text-center border-b border-r border-gray-200">
                            {day}
                        </div>
                    ))}

                    {/* Rows */}
                    {PERIODS.map((period) => (
                        <React.Fragment key={period}>
                            <div className="bg-gray-50 p-2 font-bold text-center flex items-center justify-center border-b border-r border-gray-200">
                                {period}.
                            </div>
                            {DAYS.map((day) => (
                                <div key={`${day}-${period}`} className="border-b border-r border-gray-200">
                                    <DroppableCell
                                        day={day}
                                        period={period}
                                        assignments={assignments.filter(
                                            (a) => a.day === day && a.period === period
                                        )}
                                    />
                                </div>
                            ))}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};
