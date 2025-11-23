import React, { useRef } from 'react';

interface PdfUploadProps {
    onFileChange: (file: File | null) => void;
    onProcess: () => void;
    isLoading: boolean;
    selectedFile: File | null;
}

const PdfUpload: React.FC<PdfUploadProps> = ({ onFileChange, onProcess, isLoading, selectedFile }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            onFileChange(event.target.files[0]);
        } else {
            onFileChange(null);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0];
            if (file.type === 'application/pdf') {
                onFileChange(file);
            } else {
                alert("Csak PDF fájl tölthető fel!");
            }
        }
    };

    return (
        <div className="space-y-4">
            <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf"
                    className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 font-medium">
                        {selectedFile ? selectedFile.name : 'Húzd ide a PDF fájlt, vagy kattints a tallózáshoz'}
                    </p>
                    <p className="text-xs text-gray-400">Csak .pdf fájlok támogatottak</p>
                </div>
            </div>

            <button
                onClick={onProcess}
                disabled={!selectedFile || isLoading}
                className={`w-full py-3 px-4 rounded-md text-white font-semibold shadow-md transition-all duration-200 flex items-center justify-center
          ${!selectedFile || isLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                    }`}
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
                    'Órarend Feldolgozása'
                )}
            </button>
        </div>
    );
};

export default PdfUpload;
