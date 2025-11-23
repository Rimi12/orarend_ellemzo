import React from 'react';
import type { TeacherSummary, SortConfig, SortKey } from '../types';
import { SortIcon } from './icons/SortIcon';

interface ResultsTableProps {
  data: TeacherSummary[];
  requestSort: (key: SortKey) => void;
  sortConfig: SortConfig;
  months: string[];
}

const formatMonthHeader = (monthKey: string) => {
  try {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
    return date.toLocaleString('hu-HU', { year: 'numeric', month: 'long' });
  } catch (e) {
    return monthKey; // Fallback
  }
};

const ResultsTable: React.FC<ResultsTableProps> = ({ data, requestSort, sortConfig, months }) => {
  const getSortDirection = (key: SortKey) => {
    if (sortConfig.key !== key) {
      return undefined;
    }
    return sortConfig.direction;
  };

  const mainHeaders: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'Pedagógus neve' },
    { key: 'count', label: 'Összesen' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white divide-y divide-gray-200 rounded-lg shadow border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Helyezés
            </th>
            {mainHeaders.map(({ key, label }) => (
              <th
                key={key}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => requestSort(key)}
              >
                <div className="flex items-center">
                  {label}
                  <SortIcon direction={getSortDirection(key)} />
                </div>
              </th>
            ))}
            {months.map(month => (
              <th key={month} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {formatMonthHeader(month)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={item.name} className="hover:bg-gray-50 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">{index + 1}.</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">{item.count}</td>
              {months.map(month => (
                <td key={month} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                  {item.monthlyCounts[month] || 0}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
