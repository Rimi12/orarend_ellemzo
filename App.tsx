import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { processExcelFile } from './services/excelProcessor';
import { processPdfFile } from './services/pdfProcessor';
import type { TeacherSummary, SortKey, SortConfig, TeacherSchedule } from './types';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import PdfUpload from './components/PdfUpload';
import ResultsTable from './components/ResultsTable';
import InstructionCard from './components/InstructionCard';
import FilterControls from './components/FilterControls';
import ActionButtons from './components/ActionButtons';
import FreeTeacherSearch from './components/FreeTeacherSearch';
import { TableIcon } from './components/icons/TableIcon';

import { AvailabilityManager } from './components/AvailabilityManager';

const App: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<'substitution' | 'schedule' | 'availability'>('substitution');

  // Substitution state
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<TeacherSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState('');
  const [countFilter, setCountFilter] = useState<number | string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'count', direction: 'descending' });

  // Schedule state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);


  // Load saved schedules on mount
  useEffect(() => {
    try {
      const savedSchedules = localStorage.getItem('khlista_schedules');
      if (savedSchedules) {
        setSchedules(JSON.parse(savedSchedules));
      }
    } catch (e) {
      console.error("Failed to load schedules from local storage", e);
    }
  }, []);

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setResults([]);
    setError(null);
    setNameFilter('');
    setCountFilter('');
    setSortConfig({ key: 'count', direction: 'descending' });
  };

  const handlePdfFileChange = (selectedFile: File | null) => {
    setPdfFile(selectedFile);
    setPdfError(null);
  };

  const handleClearSchedules = () => {
    setSchedules([]);
    localStorage.removeItem('khlista_schedules');
    setPdfFile(null);
  };

  const handleProcessFile = useCallback(async () => {
    if (!file) {
      setError('Kérlek, válassz egy fájlt a feldolgozáshoz.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const summary = await processExcelFile(file);
      setResults(summary);
      if (summary.length === 0) {
        setError('Nem található feldolgozható adat a fájlban. Ellenőrizd a formátumot.');
      }
    } catch (err) {
      console.error(err);
      setError('Hiba történt a fájl feldolgozása közben. Ellenőrizd, hogy a fájl formátuma megfelelő-e.');
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  const handleProcessPdf = useCallback(async () => {
    if (!pdfFile) {
      setPdfError('Kérlek, válassz egy PDF fájlt a feldolgozáshoz.');
      return;
    }

    setIsPdfLoading(true);
    setPdfError(null);
    // setSchedules([]); // Don't clear immediately to avoid flickering if we want to keep old data on error? Actually better to clear.
    // But we want to overwrite.

    try {
      const result = await processPdfFile(pdfFile);
      setSchedules(result);

      // Save to local storage
      try {
        localStorage.setItem('khlista_schedules', JSON.stringify(result));
      } catch (e) {
        console.error("Failed to save schedules to local storage", e);
        setPdfError('Sikerült feldolgozni, de a mentés nem sikerült (pl. megtelt a tárhely).');
      }

      if (result.length === 0) {
        setPdfError('Nem sikerült adatokat kinyerni a PDF-ből. Ellenőrizd, hogy szöveges PDF-ről van-e szó.');
      }
    } catch (err) {
      console.error(err);
      setPdfError('Hiba történt a PDF feldolgozása közben. Győződj meg róla, hogy nem sérült a fájl.');
    } finally {
      setIsPdfLoading(false);
    }
  }, [pdfFile]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const uniqueMonths = useMemo(() => {
    const allMonths = new Set<string>();
    results.forEach(teacher => {
      Object.keys(teacher.monthlyCounts).forEach(month => {
        allMonths.add(month);
      });
    });
    return Array.from(allMonths).sort((a, b) => a.localeCompare(b));
  }, [results]);

  const filteredAndSortedResults = useMemo(() => {
    let processableData = [...results];

    // Apply filters
    if (nameFilter) {
      processableData = processableData.filter(item =>
        item.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }
    const minCount = typeof countFilter === 'string' ? parseInt(countFilter, 10) : countFilter;
    if (!isNaN(minCount) && minCount > 0) {
      // Get current month key
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const currentMonthKey = `${year}-${month}`;

      processableData = processableData.filter(item => {
        const currentMonthCount = item.monthlyCounts[currentMonthKey] || 0;
        return currentMonthCount >= minCount;
      });
    }

    // Apply sorting
    processableData.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      // Secondary sort by name if primary keys are equal
      if (sortConfig.key !== 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return processableData;
  }, [results, nameFilter, countFilter, sortConfig]);

  const hasResults = results.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        <Header />

        {/* Tab Navigation */}
        <div className="flex justify-center mt-6 mb-8">
          <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200 inline-flex">
            <button
              onClick={() => setActiveTab('substitution')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'substitution'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              Helyettesítések
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'schedule'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              Lyukasóra Kereső
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'availability'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              Rendelkezésre állás
            </button>
          </div>
        </div>

        <main className="space-y-8">
          {activeTab === 'substitution' && (
            <>
              <InstructionCard />
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Fájl feltöltése</h2>
                <FileUpload
                  onFileChange={handleFileChange}
                  onProcess={handleProcessFile}
                  isLoading={isLoading}
                  selectedFile={file}
                />
              </div>

              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow" role="alert">
                  <p className="font-bold">Hiba</p>
                  <p>{error}</p>
                </div>
              )}

              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="flex items-center mb-4">
                  <TableIcon />
                  <h2 className="text-xl font-semibold text-gray-800 ml-3">2. Eredmények</h2>
                </div>

                {hasResults && (
                  <div className="space-y-4 mb-6 no-print">
                    <FilterControls
                      nameFilter={nameFilter}
                      onNameFilterChange={setNameFilter}
                      countFilter={countFilter}
                      onCountFilterChange={setCountFilter}
                      disabled={!hasResults}
                    />
                    <ActionButtons data={filteredAndSortedResults} disabled={filteredAndSortedResults.length === 0} />
                  </div>
                )}

                <div className="printable-area">
                  {filteredAndSortedResults.length > 0 ? (
                    <ResultsTable
                      data={filteredAndSortedResults}
                      requestSort={requestSort}
                      sortConfig={sortConfig}
                      months={uniqueMonths}
                    />
                  ) : (
                    <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">
                        {hasResults ? 'A szűrési feltételeknek egyetlen eredmény sem felel meg.' : 'Még nincsenek eredmények. Töltsön fel és dolgozzon fel egy Excel fájlt a kimutatás megtekintéséhez.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'schedule' && (
            <>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Órarend PDF feltöltése</h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Töltsd fel a Kréta rendszerből exportált, tanárok órarendjét tartalmazó PDF fájlt.
                </p>
                <PdfUpload
                  onFileChange={handlePdfFileChange}
                  onProcess={handleProcessPdf}
                  isLoading={isPdfLoading}
                  selectedFile={pdfFile}
                />
              </div>

              {pdfError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow" role="alert">
                  <p className="font-bold">Hiba</p>
                  <p>{pdfError}</p>
                </div>
              )}

              {schedules.length > 0 && (
                <FreeTeacherSearch
                  schedules={schedules}
                  substitutionData={results}
                />
              )}
            </>
          )}

          {activeTab === 'availability' && (
            <AvailabilityManager schedules={schedules} />
          )}
        </main>
        <footer className="text-center mt-12 text-gray-500 text-sm no-print">
          <p>&copy; {new Date().getFullYear()} Helyettesítés Összesítő. Minden jog fenntartva.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
