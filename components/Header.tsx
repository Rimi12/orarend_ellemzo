
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center py-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
        Kréta Helyettesítés Összesítő
      </h1>
      <p className="mt-2 text-md text-gray-500">
        Automatizált kimutatás a helyettesítések számáról, havi bontásban
      </p>
    </header>
  );
};

export default Header;
