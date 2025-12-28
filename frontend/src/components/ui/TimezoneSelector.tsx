/**
 * TimezoneSelector component
 * Displays a dropdown for selecting IANA timezone
 */
import React from 'react';

interface TimezoneSelectorProps {
  value: string | null;
  onChange: (timezone: string | null) => void;
  label?: string;
  disabled?: boolean;
}

// Common timezones grouped by region
const TIMEZONES = {
  'UTC': [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' }
  ],
  'Americas': [
    { value: 'America/New_York', label: 'New York (UTC-5)' },
    { value: 'America/Chicago', label: 'Chicago (UTC-6)' },
    { value: 'America/Denver', label: 'Denver (UTC-7)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
    { value: 'America/Anchorage', label: 'Anchorage (UTC-9)' },
    { value: 'America/Toronto', label: 'Toronto (UTC-5)' },
    { value: 'America/Mexico_City', label: 'Mexico City (UTC-6)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
    { value: 'America/Buenos_Aires', label: 'Buenos Aires (UTC-3)' }
  ],
  'Europe': [
    { value: 'Europe/London', label: 'London (UTC+0)' },
    { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
    { value: 'Europe/Berlin', label: 'Berlin (UTC+1)' },
    { value: 'Europe/Madrid', label: 'Madrid (UTC+1)' },
    { value: 'Europe/Rome', label: 'Rome (UTC+1)' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam (UTC+1)' },
    { value: 'Europe/Brussels', label: 'Brussels (UTC+1)' },
    { value: 'Europe/Zurich', label: 'Zurich (UTC+1)' },
    { value: 'Europe/Moscow', label: 'Moscow (UTC+3)' }
  ],
  'Asia': [
    { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
    { value: 'Asia/Kolkata', label: 'Kolkata (UTC+5:30)' },
    { value: 'Asia/Bangkok', label: 'Bangkok (UTC+7)' },
    { value: 'Asia/Singapore', label: 'Singapore (UTC+8)' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong (UTC+8)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (UTC+8)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
    { value: 'Asia/Seoul', label: 'Seoul (UTC+9)' }
  ],
  'Pacific': [
    { value: 'Australia/Sydney', label: 'Sydney (UTC+10)' },
    { value: 'Australia/Melbourne', label: 'Melbourne (UTC+10)' },
    { value: 'Pacific/Auckland', label: 'Auckland (UTC+12)' }
  ],
  'Africa': [
    { value: 'Africa/Cairo', label: 'Cairo (UTC+2)' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg (UTC+2)' },
    { value: 'Africa/Lagos', label: 'Lagos (UTC+1)' }
  ]
};

const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({
  value,
  onChange,
  label,
  disabled = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    onChange(newValue === '' ? null : newValue);
  };

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor="timezone-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <select
        id="timezone-select"
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        aria-label={label || 'Select timezone'}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Select timezone...</option>

        {Object.entries(TIMEZONES).map(([region, timezones]) => (
          <optgroup key={region} label={region}>
            {timezones.map(tz => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
};

export default TimezoneSelector;
