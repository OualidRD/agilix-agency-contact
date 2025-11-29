'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import styles from './agencies.module.css';

interface Agency {
  [key: string]: string;
}

// ════════════════════════════════════════════════════════════════
// AGENCIES: Show key info in list, extended info in modal
// ════════════════════════════════════════════════════════════════

// Columns to display in TABLE (key information)
const DISPLAY_COLUMNS = ['name', 'state', 'type', 'population', 'website', 'county'];

// Columns to exclude from ALL views (system/internal fields)
const EXCLUDE_COLUMNS = [
  'total_schools',         // Education-only metric
  'total_students',        // Education-only metric
  'mailing_address',       // Internal
  'grade_span',            // Education-only
  'locale',                // Geographic code (not needed)
  'csa_cbsa',              // Metropolitan area code
  'domain_name',           // IT system internal
  'status',                // System status flag
  'student_teacher_ratio', // Education-only
  'supervisory_union',     // Education-only
  'created_at',            // System metadata
  'updated_at',            // System metadata
  'id',                    // System ID
];

// Columns that can be used for filtering
const FILTER_COLUMNS = ['state', 'type', 'county'];
const ITEMS_PER_PAGE = 10;

export default function AgenciesPage() {
  const router = useRouter();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [filteredAgencies, setFilteredAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<{ [key: string]: string }>({
    state: '',
    type: '',
    county: '',
  });
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [filterOptions, setFilterOptions] = useState<{ [key: string]: string[] }>({
    state: [],
    type: [],
    county: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const response = await fetch('/api/agencies');
        if (!response.ok) throw new Error('Failed to fetch agencies');
        const data = await response.json();
        setAgencies(data);
        setFilteredAgencies(data);

        // Extract unique values for filter dropdowns
        const options: { [key: string]: Set<string> } = {
          state: new Set(),
          type: new Set(),
          county: new Set(),
        };

        data.forEach((agency: Agency) => {
          if (agency.state) options.state.add(agency.state);
          if (agency.type) options.type.add(agency.type);
          if (agency.county) options.county.add(agency.county);
        });

        setFilterOptions({
          state: Array.from(options.state).filter(Boolean).sort(),
          type: Array.from(options.type).filter(Boolean).sort(),
          county: Array.from(options.county).filter(Boolean).sort(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAgencies();
  }, []);

  useEffect(() => {
    let filtered = agencies;

    // Apply text search
    if (searchTerm) {
      filtered = filtered.filter((agency) =>
        Object.values(agency).some((value) =>
          value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter((agency) => agency[key] === value);
      }
    });

    setFilteredAgencies(filtered);
    setCurrentPage(1);
  }, [filters, agencies, searchTerm]);

  const handleFilterChange = (column: string, value: string) => {
    setFilters({
      ...filters,
      [column]: value,
    });
  };

  const clearAllFilters = () => {
    setFilters({
      state: '',
      type: '',
      county: '',
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredAgencies.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedAgencies = filteredAgencies.slice(startIdx, endIdx);

  const getDisplayData = (agency: Agency): { [key: string]: string } => {
    const result: { [key: string]: string } = {};
    Object.entries(agency).forEach(([key, value]) => {
      if (!EXCLUDE_COLUMNS.includes(key)) {
        result[key] = value;
      }
    });
    return result;
  };

  if (error)
    return (
      <div>
        <Navbar />
        <div className={styles.errorContainer}>
          <p className={styles.error}>{error}</p>
          <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );

  return (
    <div>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>Agencies</h1>
            <p>
              {filteredAgencies.length} agencies found
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
            </p>
          </div>
          <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
            ← Back
          </button>
        </div>

        {/* Filters and Search Section */}
        {!loading && agencies.length > 0 && (
          <div className={styles.filtersContainer}>
            <div className={styles.filterLabel}>Filter by:</div>
            <div className={styles.filtersGrid}>
              <div className={styles.filterGroup}>
                <label htmlFor="search-agencies" className={styles.filterFieldLabel}>
                  Search
                </label>
                <input
                  id="search-agencies"
                  type="text"
                  placeholder="Search agencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.filterSelect}
                  style={{ height: '2.375rem', padding: '0.5rem 11.75rem' }}
                />
              </div>
              {FILTER_COLUMNS.map((column) => (
                <div key={column} className={styles.filterGroup}>
                  <label htmlFor={`filter-${column}`} className={styles.filterFieldLabel}>
                    {column.charAt(0).toUpperCase() + column.slice(1)}
                  </label>
                  <select
                    id={`filter-${column}`}
                    value={filters[column]}
                    onChange={(e) => handleFilterChange(column, e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="">All</option>
                    {filterOptions[column].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {Object.values(filters).some((v) => v) && (
                <button onClick={clearAllFilters} className={styles.clearFiltersBtn}>
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loadingContainer}>
            <p>Loading agencies...</p>
          </div>
        ) : filteredAgencies.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No agencies found</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {DISPLAY_COLUMNS.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAgencies.map((agency, idx) => (
                  <tr key={idx}>
                    {DISPLAY_COLUMNS.map((col) => (
                      <td key={col}>
                        {col === 'website' && agency[col] && agency[col] !== 'N/A' ? (
                          <a 
                            href={agency[col].startsWith('http') ? agency[col] : `https://${agency[col]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.tableLink}
                          >
                            {agency[col]}
                          </a>
                        ) : (
                          agency[col] || 'N/A'
                        )}
                      </td>
                    ))}
                    <td>
                      <button
                        onClick={() => setSelectedAgency(agency)}
                        className={styles.viewButton}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={styles.backButton}
                >
                  ← Previous
                </button>
                <div className={styles.pageInfo}>
                  Page <span className={styles.currentPage}>{currentPage}</span> of{' '}
                  <span className={styles.totalPages}>{totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={styles.backButton}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal/Details Overlay */}
        {selectedAgency && (
          <div className={styles.modalOverlay} onClick={() => setSelectedAgency(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button
                className={styles.closeButton}
                onClick={() => setSelectedAgency(null)}
              >
                ✕
              </button>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>{selectedAgency.name}</h2>
                {selectedAgency.type && (
                  <span className={styles.modalBadge}>{selectedAgency.type}</span>
                )}
              </div>
              <div className={styles.modalBody}>
                <div className={styles.modalGrid}>
                  {Object.entries(getDisplayData(selectedAgency)).map(([key, value]) => (
                    <div key={key} className={styles.modalItem}>
                      <label className={styles.modalLabel}>
                        {key.charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}
                      </label>
                      <p className={styles.modalValue}>
                        {key === 'website' && value && value !== 'N/A' ? (
                          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className={styles.modalLink}>
                            {value}
                          </a>
                        ) : (
                          value || 'N/A'
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
