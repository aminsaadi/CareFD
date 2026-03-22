import React, { useState } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';

const SearchBar = ({ onSearch, placeholder = 'חפש...', showFilters = false, filters = [], onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md border-2 border-carefd-teal-pale">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-10 border border-carefd-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-carefd-teal focus:border-transparent"
            data-testid="search-input"
          />
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-carefd-gray" />
        </div>
        <button
          type="submit"
          className="bg-carefd-teal text-white px-6 py-3 rounded-lg hover:bg-carefd-teal-medium transition-colors font-medium"
          data-testid="search-btn"
        >
          חפש
        </button>
        {showFilters && (
          <button
            type="button"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="bg-carefd-navy text-white px-4 py-3 rounded-lg hover:bg-carefd-slate transition-colors"
            data-testid="filter-btn"
          >
            <FaFilter />
          </button>
        )}
      </form>

      {showFilterMenu && showFilters && filters.length > 0 && (
        <div className="mt-4 grid md:grid-cols-3 gap-4" data-testid="filter-menu">
          {filters.map((filter) => (
            <div key={filter.name}>
              <label className="block text-sm font-medium text-carefd-navy mb-1">
                {filter.label}
              </label>
              {filter.type === 'select' ? (
                <select
                  value={filter.value}
                  onChange={(e) => onFilterChange(filter.name, e.target.value)}
                  className="w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal"
                >
                  <option value="">הכל</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={filter.type || 'text'}
                  value={filter.value}
                  onChange={(e) => onFilterChange(filter.name, e.target.value)}
                  className="w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal"
                  placeholder={filter.placeholder}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;