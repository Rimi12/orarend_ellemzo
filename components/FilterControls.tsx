import React from 'react';

interface FilterControlsProps {
    nameFilter: string;
    onNameFilterChange: (value: string) => void;
    countFilter: number | string;
    onCountFilterChange: (value: string) => void;
    disabled: boolean;
}

const FilterControls: React.FC<FilterControlsProps> = ({
    nameFilter,
    onNameFilterChange,
    countFilter,
    onCountFilterChange,
    disabled
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
                <label htmlFor="name-filter" className="block text-sm font-medium text-gray-700">
                    Szűrés névre
                </label>
                <div className="mt-1">
                    <input
                        type="text"
                        id="name-filter"
                        value={nameFilter}
                        onChange={(e) => onNameFilterChange(e.target.value)}
                        placeholder="Keresés a nevek között..."
                        disabled={disabled}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-200"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="count-filter" className="block text-sm font-medium text-gray-700">
                    Helyettesítések száma (minimum)
                </label>
                <div className="mt-1">
                    <input
                        type="number"
                        id="count-filter"
                        value={countFilter}
                        onChange={(e) => onCountFilterChange(e.target.value)}
                        min="0"
                        placeholder="Pl. 5"
                        disabled={disabled}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-200"
                    />
                </div>
            </div>
        </div>
    );
};

export default FilterControls;
