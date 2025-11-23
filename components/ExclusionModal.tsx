import React from 'react';

interface ExclusionModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacherName: string;
    exclusions: { day: string; period: number }[];
    onToggleExclusion: (day: string, period: number) => void;
}

const DAYS = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export const ExclusionModal: React.FC<ExclusionModalProps> = ({
    isOpen,
    onClose,
    teacherName,
    exclusions,
    onToggleExclusion,
}) => {
    if (!isOpen) return null;

    const isExcluded = (day: string, period: number) => {
        return exclusions.some(e => e.day === day && e.period === period);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 m-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                        Kizárások beállítása: <span className="text-blue-600">{teacherName}</span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                    Kattints azokra az órákra, ahol a pedagógus <strong>NEM</strong> osztható be rendelkezésre állásra (pl. külsős órák miatt).
                    A piros szín jelzi a tiltott időpontokat.
                </p>

                <div className="overflow-x-auto">
                    <div className="min-w-[500px]">
                        <div className="grid grid-cols-[50px_repeat(5,_1fr)] gap-1">
                            {/* Header */}
                            <div className="bg-gray-100 p-2 text-center font-bold rounded">#</div>
                            {DAYS.map(day => (
                                <div key={day} className="bg-gray-100 p-2 text-center font-bold rounded">
                                    {day}
                                </div>
                            ))}

                            {/* Grid */}
                            {PERIODS.map(period => (
                                <React.Fragment key={period}>
                                    <div className="bg-gray-50 p-2 text-center font-bold flex items-center justify-center rounded">
                                        {period}.
                                    </div>
                                    {DAYS.map(day => {
                                        const excluded = isExcluded(day, period);
                                        return (
                                            <button
                                                key={`${day}-${period}`}
                                                onClick={() => onToggleExclusion(day, period)}
                                                className={`p-3 border rounded transition-colors duration-200 flex items-center justify-center ${excluded
                                                        ? 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200'
                                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                                    }`}
                                                title={excluded ? 'Tiltva' : 'Engedélyezve'}
                                            >
                                                {excluded ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                    </svg>
                                                ) : (
                                                    <span className="text-gray-300">✓</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Kész
                    </button>
                </div>
            </div>
        </div>
    );
};
