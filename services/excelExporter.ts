import type { TeacherSummary } from '../types';

// XLSX is loaded from a CDN script in index.html, so we declare it globally.
declare var XLSX: any;

const formatMonthHeader = (monthKey: string) => {
  try {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
    return date.toLocaleString('hu-HU', { year: 'numeric', month: 'long' });
  } catch (e) {
    return monthKey; // Fallback
  }
};

export const exportToExcel = (data: TeacherSummary[], fileName: string): void => {
  // Find all unique months from the dataset and sort them chronologically
  const allMonths = new Set<string>();
  data.forEach(teacher => {
    Object.keys(teacher.monthlyCounts).forEach(month => {
      allMonths.add(month);
    });
  });
  const sortedMonths = Array.from(allMonths).sort((a, b) => a.localeCompare(b));

  // Transform data into a flat structure suitable for json_to_sheet
  const dataForSheet = data.map((item, index) => {
    const row: { [key: string]: string | number } = {
      'Helyezés': index + 1,
      'Pedagógus neve': item.name,
      'Összesen': item.count,
    };
    
    sortedMonths.forEach(month => {
      const formattedHeader = formatMonthHeader(month);
      row[formattedHeader] = item.monthlyCounts[month] || 0;
    });

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Havi Kimutatás');

  // Adjust column widths dynamically
  const colWidths = [
    { wch: 10 }, // Helyezés
    { wch: 40 }, // Pedagógus neve
    { wch: 12 }, // Összesen
  ];
  sortedMonths.forEach(month => {
    colWidths.push({ wch: formatMonthHeader(month).length + 4 });
  });
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, fileName);
};
