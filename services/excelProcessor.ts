import type { TeacherSummary } from '../types';

// XLSX is loaded from a CDN script in index.html, so we declare it globally.
declare var XLSX: any;

/**
 * Converts various Excel date formats (serial, string, Date object) to a 'YYYY-MM' key.
 * @param excelDate The date value from an Excel cell.
 * @returns A string in 'YYYY-MM' format or 'Invalid Date'.
 */
const getMonthKey = (excelDate: any): string => {
  if (excelDate === null || excelDate === undefined) {
    return 'Invalid Date';
  }

  let dateObj: Date;
  if (typeof excelDate === 'number') {
    // Handle Excel serial date number, which is the number of days since 1900-01-01.
    // The formula adjusts for the 1900 leap year bug in Excel.
    dateObj = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
  } else if (typeof excelDate === 'string') {
    dateObj = new Date(excelDate);
  } else if (excelDate instanceof Date) {
    dateObj = excelDate;
  } else {
    return 'Invalid Date';
  }

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};


/**
 * Processes an uploaded Excel file to summarize teacher substitutions.
 * @param file The Excel file to process.
 * @returns A promise that resolves to an array of TeacherSummary objects.
 */
export const processExcelFile = (file: File): Promise<TeacherSummary[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        if (!event.target?.result) {
          return reject(new Error("Failed to read file."));
        }

        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to array of arrays, skipping the header row (data starts from row 2).
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 1 });

        const uniqueSubstitutions = new Map<string, { teacher: string; date: any }>();

        rows.forEach(row => {
          // A: Dátum (0), B: Óra (1), G: Helyettesítő tanár (6)
          const date = row[0];
          const period = row[1];
          const teacher = row[6];

          // Ensure the row has the required data before processing.
          if (teacher && date !== undefined && period !== undefined) {
             const teacherName = teacher.toString().trim();
             // Create a unique key for each substitution event to handle parallel classes.
             // A teacher substituting in the same period on the same day is one event.
            const uniqueKey = `${date instanceof Date ? date.toISOString() : date}-${period}-${teacherName}`;
            
            if (!uniqueSubstitutions.has(uniqueKey)) {
                uniqueSubstitutions.set(uniqueKey, { teacher: teacherName, date });
            }
          }
        });
        
        const teacherSummaries: { [key: string]: TeacherSummary } = {};

        for (const { teacher, date } of uniqueSubstitutions.values()) {
            if (!teacherSummaries[teacher]) {
                teacherSummaries[teacher] = {
                    name: teacher,
                    count: 0,
                    monthlyCounts: {},
                };
            }

            const summary = teacherSummaries[teacher];
            summary.count += 1;

            const monthKey = getMonthKey(date);
            if (monthKey !== 'Invalid Date') {
                summary.monthlyCounts[monthKey] = (summary.monthlyCounts[monthKey] || 0) + 1;
            }
        }
        
        const summaryArray: TeacherSummary[] = Object.values(teacherSummaries);
        resolve(summaryArray);

      } catch (error) {
        console.error("Error processing Excel file:", error);
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};
