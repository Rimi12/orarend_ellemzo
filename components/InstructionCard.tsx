
import React from 'react';

const InstructionCard: React.FC = () => {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-3">Útmutató a fájlformátumhoz</h3>
      <p className="mb-4">
        Az alkalmazás a Kréta rendszerből exportált helyettesítési napló feldolgozására készült.
        Kérjük, győződjön meg róla, hogy az Excel fájl a következő oszlopokat tartalmazza a megfelelő helyen (az adatoknak a 2. sortól kell kezdődniük):
      </p>
      <ul className="list-disc list-inside space-y-2 font-mono text-sm bg-white p-4 rounded border border-blue-200">
        <li><span className="font-bold text-blue-900">A oszlop:</span> Dátum</li>
        <li><span className="font-bold text-blue-900">B oszlop:</span> Óra</li>
        <li><span className="font-bold text-blue-900">G oszlop:</span> Helyettesítő tanár neve</li>
        <li><span className="font-bold text-blue-900">H oszlop:</span> Osztály / Csoport</li>
      </ul>
      <p className="mt-4 text-sm">
        <strong>Fontos:</strong> Az alkalmazás automatikusan kezeli a párhuzamos órákat. Ha egy tanár ugyanabban az időpontban több csoportot helyettesít, az egyetlen helyettesítésnek számít. Az eredmények havi bontásban is megtekinthetők.
      </p>
    </div>
  );
};

export default InstructionCard;
