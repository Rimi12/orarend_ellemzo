import { TeacherSchedule } from '../types';
import { StandbyAssignment } from '../types';

const DAYS = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek'];
const MAX_DAILY_HOURS = 7;
const WEEKLY_QUOTA = 3;

interface Slot {
    day: string;
    period: number;
    priority: number; // Higher is better
    type: 'gap' | 'adjacent';
}

export const generateStandbySchedule = (
    selectedTeachers: string[],
    schedules: TeacherSchedule[],
    existingAssignments: StandbyAssignment[] = []
): StandbyAssignment[] => {
    let newAssignments = [...existingAssignments];

    // Helper to count daily hours for a teacher
    const getDailyHours = (teacherName: string, day: string): number => {
        const teacher = schedules.find(t => t.name === teacherName);
        if (!teacher) return 0;

        // Count teaching hours
        // Note: TeacherSchedule.freePeriods lists FREE periods. 
        // We assume 1-8 are the relevant periods.
        // If a period is NOT in freePeriods, it is a teaching period.
        let teachingHours = 0;
        const freePeriods = teacher.freePeriods[day] || [];
        for (let i = 1; i <= 8; i++) {
            if (!freePeriods.includes(i)) {
                teachingHours++;
            }
        }

        // Count existing standby hours
        const standbyHours = newAssignments.filter(
            a => a.teacherName === teacherName && a.day === day
        ).length;

        return teachingHours + standbyHours;
    };

    // Helper to count weekly standby slots
    const getWeeklyStandbyCount = (teacherName: string): number => {
        return newAssignments.filter(a => a.teacherName === teacherName).length;
    };

    for (const teacherName of selectedTeachers) {
        const teacher = schedules.find(t => t.name === teacherName);
        if (!teacher) continue;

        let assignedCount = getWeeklyStandbyCount(teacherName);
        if (assignedCount >= WEEKLY_QUOTA) continue;

        const potentialSlots: Slot[] = [];

        for (const day of DAYS) {
            const freePeriods = teacher.freePeriods[day] || [];
            // We only care about periods 1-8
            const relevantFreePeriods = freePeriods.filter(p => p >= 1 && p <= 8).sort((a, b) => a - b);

            // Determine teaching periods to find gaps
            const teachingPeriods: number[] = [];
            for (let i = 1; i <= 8; i++) {
                if (!freePeriods.includes(i)) {
                    teachingPeriods.push(i);
                }
            }
            teachingPeriods.sort((a, b) => a - b);

            if (teachingPeriods.length === 0) {
                // If no teaching at all this day, maybe we don't assign standby? 
                // Or we treat it as all adjacent?
                // User said: "Csak olyan helyre irhatjuk be rendelkezésre állásra ha előtte vagy utána közvetlen óra volt."
                // So if no teaching, no standby.
                continue;
            }

            const firstLesson = teachingPeriods[0];
            const lastLesson = teachingPeriods[teachingPeriods.length - 1];

            for (const period of relevantFreePeriods) {
                // Check if already assigned
                if (newAssignments.some(a => a.teacherName === teacherName && a.day === day && a.period === period)) {
                    continue;
                }

                // Check daily limit
                if (getDailyHours(teacherName, day) >= MAX_DAILY_HOURS) {
                    continue;
                }

                // 1. Gap detection (Lyukasóra)
                // A gap is a free period that has teaching before AND after it.
                // But "before and after" might be separated by multiple gaps.
                // Simplest check: is it between first and last lesson?
                if (period > firstLesson && period < lastLesson) {
                    potentialSlots.push({ day, period, priority: 2, type: 'gap' });
                }
                // 2. Adjacent detection
                // Immediately before first lesson or immediately after last lesson.
                else if (period === firstLesson - 1 || period === lastLesson + 1) {
                    potentialSlots.push({ day, period, priority: 1, type: 'adjacent' });
                }
            }
        }

        // Sort slots: Gaps first (priority 2), then Adjacent (priority 1).
        // Secondary sort could be to balance days, but for now simple sort.
        potentialSlots.sort((a, b) => b.priority - a.priority);

        // Assign slots up to quota
        for (const slot of potentialSlots) {
            if (assignedCount >= WEEKLY_QUOTA) break;

            // Re-check daily limit as we might have just added a slot to this day
            if (getDailyHours(teacherName, slot.day) >= MAX_DAILY_HOURS) continue;

            newAssignments.push({
                id: `${teacherName}-${slot.day}-${slot.period}-${Date.now()}-${Math.random()}`,
                teacherName,
                day: slot.day,
                period: slot.period
            });
            assignedCount++;
        }
    }

    return newAssignments;
};
