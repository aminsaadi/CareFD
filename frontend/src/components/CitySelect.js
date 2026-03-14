import React, { useState, useRef, useEffect, useCallback } from 'react';
import { israeliLocalities } from '../data/israeliLocalities';

const sortedCities = [...new Set(israeliLocalities.map(l => l.name))].sort((a, b) => a.localeCompare(b, 'he'));

const CitySelect = ({
  value,
  onChange,
  name = 'city',
  placeholder = 'הקלד לחיפוש או בחר עיר...',
  required = false,
  className = '',
  inputClassName = '',
  disabled = false,
  'data-testid': dataTestId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = search
    ? sortedCities.filter(city => city.includes(search))
    : sortedCities;

  const handleSelect = useCallback((city) => {
    onChange({ target: { name, value: city } });
    setSearch('');
    setIsOpen(false);
  }, [onChange, name]);

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    setIsOpen(true);
    if (!e.target.value) {
      onChange({ target: { name, value: '' } });
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    setSearch('');
  };

  const handleClear = () => {
    onChange({ target: { name, value: '' } });
    setSearch('');
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = isOpen ? search : (value || '');

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={value ? value : placeholder}
          required={required && !value}
          disabled={disabled}
          className={inputClassName || 'w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent'}
          autoComplete="off"
          data-testid={dataTestId}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            tabIndex={-1}
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filtered.slice(0, 50).map((city) => (
            <li
              key={city}
              onClick={() => handleSelect(city)}
              className={`px-4 py-2.5 cursor-pointer hover:bg-teal-50 transition text-sm ${
                city === value ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'
              }`}
            >
              {city}
            </li>
          ))}
          {filtered.length > 50 && (
            <li className="px-4 py-2 text-xs text-gray-400 text-center">
              הקלד לצמצום התוצאות ({filtered.length} ערים)
            </li>
          )}
        </ul>
      )}

      {isOpen && search && filtered.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-sm text-gray-500">
          לא נמצאו תוצאות
        </div>
      )}
    </div>
  );
};

export { sortedCities };
export default CitySelect;
