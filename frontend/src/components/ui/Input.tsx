import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText && !error ? `${inputId}-helper` : undefined;

  const baseClasses = 'block px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm dark:bg-gray-700 dark:text-white';
  const stateClasses = error
    ? 'border-red-300 text-red-900 dark:text-red-300 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500';

  const widthClass = fullWidth ? 'w-full' : '';
  const classes = [baseClasses, stateClasses, widthClass, className].join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={classes}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={errorId || helperId}
        aria-required={props.required}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;