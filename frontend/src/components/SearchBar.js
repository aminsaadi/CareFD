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
    <div className="bg-white p-4 rounded-xl shadow-md border-2 border-carelink-teal-pale">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-10 border border-carelink-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-carelink-teal focus:border-transparent"
            data-testid="search-input"
          />
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-carelink-gray" />
        </div>
        <button
          type="submit"
          className="bg-carelink-teal text-white px-6 py-3 rounded-lg hover:bg-carelink-teal-medium transition-colors font-medium"
          data-testid="search-btn"
        >
          חפש
        </button>
        {showFilters && (
          <button
            type="button"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="bg-carelink-navy text-white px-4 py-3 rounded-lg hover:bg-carelink-slate transition-colors"
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
              <label className="block text-sm font-medium text-carelink-navy mb-1">
                {filter.label}
              </label>
              {filter.type === 'select' ? (
                <select
                  value={filter.value}
                  onChange={(e) => onFilterChange(filter.name, e.target.value)}
                  className="w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
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
                  className="w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
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