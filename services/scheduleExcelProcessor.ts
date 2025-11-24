import readXlsxFile from 'read-excel-file';
import { TeacherSchedule } from '../types';

const DAYS = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek'];

export const processScheduleExcelFile = async (file: File): Promise<TeacherSchedule[]> => {
    try {
        const rows = await readXlsxFile(file);

        // Expected columns based on user description/screenshot:
        // B: Nap (Index 1)
        // C: Óra (Index 2)
        // G: Tanár (Index 6)

        const teacherMap = new Map<string, Map<string, Set<number>>>();

        // Start from row 1 (skip header row 0)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];

            // Safe access
            const day = row[1] as string;
            const periodVal = row[2];
            const teacherName = row[6] as string;

            if (!day || !teacherName || !DAYS.includes(day)) {
                continue;
            }

            // Parse period
            let period: number;
            if (typeof periodVal === 'number') {
                period = periodVal;
            } else if (typeof periodVal === 'string') {
                // Handle "1." or "1"
                period = parseInt(periodVal.replace('.', ''));
            } else {
                continue;
            }

            if (isNaN(period) || period < 1 || period > 8) {
                continue;
            }

            // Add to map
            if (!teacherMap.has(teacherName)) {
                teacherMap.set(teacherName, new Map());
                DAYS.forEach(d => teacherMap.get(teacherName)!.set(d, new Set()));
            }

            teacherMap.get(teacherName)!.get(day)!.add(period);
        }

        // Convert to TeacherSchedule[]
        const schedules: TeacherSchedule[] = [];

        teacherMap.forEach((dayMap, teacherName) => {
            const freePeriods: { [day: string]: number[] } = {};

            DAYS.forEach(day => {
                const occupiedPeriods = dayMap.get(day) || new Set();
                const free: number[] = [];
                for (let p = 1; p <= 8; p++) {
                    if (!occupiedPeriods.has(p)) {
                        free.push(p);
                    }
                }
                freePeriods[day] = free;
            });

            schedules.push({
                name: teacherName,
                freePeriods: freePeriods
            });
        });

        // Sort by name
        schedules.sort((a, b) => a.name.localeCompare(b.name));

        return schedules;

    } catch (error: any) {
        console.error("Excel processing error:", error);
        throw new Error(`Excel feldolgozási hiba: ${error.message || error}`);
    }
};
