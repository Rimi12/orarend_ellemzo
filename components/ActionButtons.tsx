import React from 'react';
import type { TeacherSummary } from '../types';
import { exportToExcel } from '../services/excelExporter';
import { ExportIcon } from './icons/ExportIcon';
import { PrintIcon } from './icons/PrintIcon';

interface ActionButtonsProps {
  data: TeacherSummary[];
  disabled: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ data, disabled }) => {
  const handleExport = () => {
    const today = new Date().toISOString().slice(0, 10);
    exportToExcel(data, `helyettesites_kimutatas_${today}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-4">
      <button
        onClick={handleExport}
        disabled={disabled}
        className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <ExportIcon />
        <span className="ml-2">Mentés Excelbe</span>
      </button>
      <button
        onClick={handlePrint}
        disabled={disabled}
        className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <PrintIcon />
        <span className="ml-2">Nyomtatás</span>
      </button>
    </div>
  );
};

export default ActionButtons;
