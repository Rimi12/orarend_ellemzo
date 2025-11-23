import React, { useState, useMemo, useEffect } from 'react';
import { TeacherSchedule, TeacherSummary } from '../types';

interface FreeTeacherSearchProps {
  schedules: TeacherSchedule[];
  substitutionData: TeacherSummary[];
}

const FreeTeacherSearch: React.FC<FreeTeacherSearchProps> = ({ schedules, substitutionData }) => {
  const [selectedDay, setSelectedDay] = useState<string>('Hétfő');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);

  // Jelenlévő tanárok listája (alapértelmezetten mindenki, aki a PDF-ben van)
  const [availableTeachers, setAvailableTeachers] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const days = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Amikor betöltődik az órarend, betöltjük a mentett beállításokat
  useEffect(() => {
    if (schedules.length > 0) {
      const allNames = schedules.map(t => t.name);
      try {
        const savedExcluded = JSON.parse(localStorage.getItem('khlista_excluded_teachers') || '[]');
        // Csak azokat zárjuk ki, akik tényleg léteznek a mostani listában
        const initialAvailable = allNames.filter(name => !savedExcluded.includes(name));
        setAvailableTeachers(initialAvailable);
      } catch (e) {
        console.error("Hiba a mentett beállítások betöltésekor:", e);
        setAvailableTeachers(allNames);
      }
    }
  }, [schedules]);

  // Mentés a LocalStorage-ba, amikor változik a lista
  // Fontos: csak akkor mentsünk, ha már van adatunk (hogy ne írjuk felül üresre inicializáláskor)
  useEffect(() => {
    if (schedules.length > 0 && availableTeachers.length >= 0) {
      const allNames = schedules.map(t => t.name);
      const excluded = allNames.filter(name => !availableTeachers.includes(name));
      localStorage.setItem('khlista_excluded_teachers', JSON.stringify(excluded));
    }
  }, [availableTeachers, schedules]);

  const toggleTeacherAvailability = (teacherName: string) => {
    setAvailableTeachers(prev =>
      prev.includes(teacherName)
        ? prev.filter(name => name !== teacherName)
        : [...prev, teacherName]
    );
  };

  const currentMonthKey = useMemo(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  const currentMonthLabel = useMemo(() => {
    const date = new Date();
    return date.toLocaleString('hu-HU', { year: 'numeric', month: 'long' });
  }, []);

  const freeTeachers = useMemo(() => {
    if (!schedules || schedules.length === 0) return [];

    return schedules
      .filter(teacher => availableTeachers.includes(teacher.name)) // Csak a jelenlévők
      .filter(teacher => {
        const daySchedule = teacher.freePeriods[selectedDay];
        if (!daySchedule) return false;
        return daySchedule.includes(selectedPeriod);
      })
      .map(teacher => {
        // Helyettesítési statisztika keresése
        // Megpróbáljuk megtalálni a tanárt az Excel adatokban
        // Pontos egyezést keresünk.
        const subData = substitutionData.find(s => s.name.toLowerCase() === teacher.name.toLowerCase());
        let subCount = 0;

        if (subData) {
          // Közvetlenül a kulcs alapján keresünk
          subCount = subData.monthlyCounts[currentMonthKey] || 0;
        }

        return {
          ...teacher,
          subCount
        };
      })
      // Rendezés: Kevesebb helyettesítéssel rendelkezők előre? Vagy névsor?
      // Legyen névsor.
      .sort((a, b) => a.name.localeCompare(b.name));

  }, [schedules, selectedDay, selectedPeriod, availableTeachers, substitutionData, currentMonthKey]);

  const allTeacherNames = useMemo(() => schedules.map(t => t.name).sort(), [schedules]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800">Lyukasóra Kereső</h2>
        </div>

        {/* Hiányzók kezelése gomb */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Jelenlét kezelése ({availableTeachers.length}/{allTeacherNames.length})
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 z-10 mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto">
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Tanárok jelenléte</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setAvailableTeachers(allTeacherNames)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Mind kijelöl
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setAvailableTeachers([])}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Mind töröl
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {allTeacherNames.map(name => (
                    <label key={name} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={availableTeachers.includes(name)}
                        onChange={() => toggleTeacherAvailability(name)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                      />
                      <span className={`text-sm ${availableTeachers.includes(name) ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                        {name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="day-select" className="block text-sm font-medium text-gray-700 mb-1">Nap</label>
          <select
            id="day-select"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
          >
            {days.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="period-select" className="block text-sm font-medium text-gray-700 mb-1">Óra</label>
          <select
            id="period-select"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
          >
            {periods.map(period => (
              <option key={period} value={period}>{period}. óra</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Szabad tanárok ({freeTeachers.length} fő)
        </h3>

        {freeTeachers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {freeTeachers.map((teacher, index) => (
              <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg border border-green-100 justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-sm mr-3">
                    {teacher.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-800 font-medium">{teacher.name}</span>
                    {substitutionData.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {currentMonthLabel}: <strong>{teacher.subCount}</strong> helyettesítés
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">Nincs találat a megadott időpontra (vagy mindenki hiányzik).</p>
        )}
      </div>

      {substitutionData.length === 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 flex items-start">
          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Tipp: Tölts fel egy Excel fájlt a "Helyettesítések" fülön, hogy lásd a tanárok havi helyettesítési statisztikáit is!
          </span>
        </div>
      )}
    </div>
  );
};

export default FreeTeacherSearch;
