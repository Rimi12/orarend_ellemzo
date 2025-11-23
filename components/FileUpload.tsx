
import React, { useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  onProcess: () => void;
  isLoading: boolean;
  selectedFile: File | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, onProcess, isLoading, selectedFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    onFileChange(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files ? event.dataTransfer.files[0] : null;
    onFileChange(file);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <label
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center w-full h-48 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-blue-500 focus:outline-none"
      >
        <UploadIcon />
        <span className="flex items-center space-x-2">
          <span className="font-medium text-gray-600">
            Húzza ide a fájlt, vagy <span className="text-blue-600 underline">kattintson a tallózáshoz</span>
          </span>
        </span>
        <p className="text-sm text-gray-500 mt-1">Támogatott formátum: .xlsx, .xls</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileSelect}
          className="hidden"
        />
      </label>

      {selectedFile && (
        <div className="text-center text-sm text-gray-700">
          Kiválasztott fájl: <span className="font-semibold">{selectedFile.name}</span>
        </div>
      )}

      <button
        onClick={onProcess}
        disabled={!selectedFile || isLoading}
        className="w-full sm:w-auto flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Feldolgozás...
          </>
        ) : (
          'Fájl feldolgozása'
        )}
      </button>
    </div>
  );
};

export default FileUpload;
