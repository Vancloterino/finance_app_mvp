import React from 'react';
import { Filter } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  label?: string;
  className?: string;
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  value,
  onChange,
  options,
  label = 'Filter',
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Filter className="h-4 w-4 text-gray-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">{label}: All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterSelect;
