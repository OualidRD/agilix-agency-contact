'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';
import styles from './contacts.module.css';

interface Contact {
  [key: string]: string;
}

interface Agency {
  [key: string]: string;
}

const DAILY_LIMIT = 50;
const STORAGE_KEY = 'contacts_view_count';
const CONTACTS_CACHE_KEY = 'contacts_cache';

// ════════════════════════════════════════════════════════════════
// CONTACTS: Show basic info in list, detailed info in modal
// ════════════════════════════════════════════════════════════════

// Columns to display in TABLE (basic info - can see freely, non-sensitive)
const DISPLAY_COLUMNS = ['first_name', 'last_name', 'title', 'department'];

// Columns to EXCLUDE from MODAL (system/metadata fields only)
const EXCLUDE_COLUMNS = [
  'created_at',      // System timestamp
  'updated_at',      // System timestamp
  'email_type',      // Internal classification
  'id',              // System ID
];

// Columns that can be used for filtering
const FILTER_COLUMNS = ['agency_id', 'department'];
const ITEMS_PER_PAGE = 10;

// Get today's date in UTC format
const getTodayUTC = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Get storage key for current user and day
const getStorageKey = (userId: string, date: string): string => {
  return `${STORAGE_KEY}_${userId}_${date}`;
};

// Get cache key for contacts
const getCacheKey = (userId: string, date: string): string => {
  return `${CONTACTS_CACHE_KEY}_${userId}_${date}`;
};

// Get current view count for today
const getCurrentViewCount = (userId: string): number => {
  const today = getTodayUTC();
  const storageKey = getStorageKey(userId, today);
  const stored = localStorage.getItem(storageKey);
  return stored ? parseInt(stored, 10) : 0;
};

// Increment view count for today
const incrementViewCount = (userId: string, amount: number): number => {
  const today = getTodayUTC();
  const storageKey = getStorageKey(userId, today);
  const current = getCurrentViewCount(userId);
  const newCount = current + amount;
  localStorage.setItem(storageKey, newCount.toString());
  return newCount;
};

// Save contacts to cache
const saveContactsToCache = (userId: string, date: string, contacts: Contact[]): void => {
  const cacheKey = getCacheKey(userId, date);
  localStorage.setItem(cacheKey, JSON.stringify(contacts));
};

// Load cached contacts
const loadCachedContacts = (userId: string, date: string): Contact[] => {
  const cacheKey = getCacheKey(userId, date);
  const cached = localStorage.getItem(cacheKey);
  return cached ? JSON.parse(cached) : [];
};

// Mark that the user has reached the daily limit
const markLimitReached = (userId: string): void => {
  const today = getTodayUTC();
  const limitKey = `limit_reached_${userId}_${today}`;
  localStorage.setItem(limitKey, 'true');
  // Also set view count to 50
  incrementViewCount(userId, 50);
};

// Check if limit was already reached today
const isLimitReached = (userId: string): boolean => {
  const today = getTodayUTC();
  const limitKey = `limit_reached_${userId}_${today}`;
  return localStorage.getItem(limitKey) === 'true';
};

// Get time until next UTC day reset
const getTimeUntilReset = (): string => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

// Add viewed contact to localStorage
const addViewedContact = (userId: string, contact: Contact): void => {
  const today = getTodayUTC();
  const key = `viewed_contacts_${userId}_${today}`;
  const stored = localStorage.getItem(key);
  const viewedContacts = stored ? JSON.parse(stored) : [];
  
  // Check if already in list to avoid duplicates
  const exists = viewedContacts.some(
    (c: Contact) => c.id === contact.id
  );
  
  if (!exists) {
    viewedContacts.push(contact);
    localStorage.setItem(key, JSON.stringify(viewedContacts));
  }
};

export default function ContactsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{ [key: string]: string }>({
    agency_id: '',
    department: '',
  });
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState<{ [key: string]: string[] }>({
    agency_id: [],
    department: [],
  });
  const [agencyMap, setAgencyMap] = useState<{ [key: string]: string }>({});
  const [viewedContactIds, setViewedContactIds] = useState<Set<string>>(new Set());
  const [showViewedOnly, setShowViewedOnly] = useState(false);

  // Get list of viewed contact IDs
  const getViewedContactIds = (userId: string): Set<string> => {
    const today = getTodayUTC();
    const key = `viewed_contacts_${userId}_${today}`;
    const stored = localStorage.getItem(key);
    const viewedContacts = stored ? JSON.parse(stored) : [];
    return new Set(viewedContacts.map((c: Contact) => c.id));
  };

  useEffect(() => {
    if (!user) return;

    const today = getTodayUTC();
    
    // Fetch ALL contacts and agencies
    const fetchData = async () => {
      try {
        const contactsResponse = await fetch('/api/contacts');
        if (!contactsResponse.ok) throw new Error('Failed to fetch contacts');
        const contactsData = await contactsResponse.json();

        const agenciesResponse = await fetch('/api/agencies');
        if (!agenciesResponse.ok) throw new Error('Failed to fetch agencies');
        const agenciesData = await agenciesResponse.json();

        // Build agency map (id -> name)
        const map: { [key: string]: string } = {};
        agenciesData.forEach((agency: Agency) => {
          map[agency.id] = agency.name;
        });
        setAgencyMap(map);

        // Extract unique agency names and departments for filter dropdowns
        const options: { [key: string]: Set<string> } = {
          agency_id: new Set(),
          department: new Set(),
        };

        contactsData.forEach((contact: Contact) => {
          if (contact.agency_id && map[contact.agency_id]) {
            options.agency_id.add(map[contact.agency_id]);
          }
          if (contact.department) {
            options.department.add(contact.department);
          }
        });

        setFilterOptions({
          agency_id: Array.from(options.agency_id).filter(Boolean).sort(),
          department: Array.from(options.department).filter(Boolean).sort(),
        });

        setContacts(contactsData);
        setFilteredContacts(contactsData);
        setAgencies(agenciesData);

        // Get viewed contact IDs and update state
        const viewedIds = getViewedContactIds(user.id);
        setViewedContactIds(viewedIds);

        // Check if limit was already reached
        const currentCount = getCurrentViewCount(user.id);
        if (currentCount >= DAILY_LIMIT) {
          setLimitReached(true);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Handle search
  useEffect(() => {
    let filtered = contacts;

    // Apply viewed-only filter
    if (showViewedOnly && limitReached) {
      filtered = filtered.filter((contact) => viewedContactIds.has(contact.id));
    }

    // Apply text search
    if (searchTerm) {
      filtered = filtered.filter((contact) =>
        Object.values(contact).some((value) =>
          value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply agency filter
    if (filters.agency_id) {
      filtered = filtered.filter((contact) => {
        const agencyName = agencyMap[contact.agency_id];
        return agencyName === filters.agency_id;
      });
    }

    // Apply department filter
    if (filters.department) {
      filtered = filtered.filter((contact) => contact.department === filters.department);
    }

    setFilteredContacts(filtered);
    setCurrentPage(1);
  }, [searchTerm, contacts, filters, agencyMap, showViewedOnly, limitReached, viewedContactIds]);

  const handleFilterChange = (column: string, value: string) => {
    setFilters({
      ...filters,
      [column]: value,
    });
  };

  const clearAllFilters = () => {
    setFilters({
      agency_id: '',
      department: '',
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedContacts = filteredContacts.slice(startIdx, endIdx);

  // Handle page change - allow viewing all pages freely
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) {
      return; // Only validate bounds, no artificial page limits
    }
    setCurrentPage(newPage);
  };

  // Handle opening contact details modal
  const handleViewContact = (contact: Contact) => {
    if (!user) return;

    const currentCount = getCurrentViewCount(user.id);
    const today = getTodayUTC();
    const viewedKey = `viewed_contacts_${user.id}_${today}`;
    const stored = localStorage.getItem(viewedKey);
    const viewedContacts = stored ? JSON.parse(stored) : [];
    
    // Check if user already viewed this specific contact before
    const alreadyViewed = viewedContacts.some(
      (c: Contact) => c.id === contact.id
    );

    // If user has reached 50 AND hasn't viewed this contact before, block them
    if (currentCount >= DAILY_LIMIT && !alreadyViewed) {
      setShowLimitPopup(true);
      return;
    }

    // User can view this contact
    // If they haven't viewed it before, increment counter and add to list
    if (!alreadyViewed) {
      const newCount = incrementViewCount(user.id, 1);
      addViewedContact(user.id, contact);
      
      // Update viewed contact IDs
      const updatedIds = new Set(viewedContactIds);
      updatedIds.add(contact.id);
      setViewedContactIds(updatedIds);

      // Check if this view brings them to the limit
      if (newCount >= DAILY_LIMIT) {
        setLimitReached(true);
      }
    }

    // Allow viewing (either it's a new view or they already viewed it)
    setSelectedContact(contact);
  };

  const getDisplayData = (contact: Contact): { [key: string]: string } => {
    const result: { [key: string]: string } = {};
    Object.entries(contact).forEach(([key, value]) => {
      if (!EXCLUDE_COLUMNS.includes(key)) {
        result[key] = value;
      }
    });
    
    // Replace agency_id with agency name
    if (contact.agency_id && agencyMap[contact.agency_id]) {
      result['agency'] = agencyMap[contact.agency_id];
    }
    
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
            <h1>Contacts</h1>
            <p>
              {searchTerm ? (
                <>
                  {filteredContacts.length} results found
                  {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                </>
              ) : (
                <>
                  Total: {filteredContacts.length} contacts
                </>
              )}
            </p>
          </div>
          <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
            ← Back
          </button>
        </div>

        {/* Filters and Search Section */}
        {!loading && contacts.length > 0 && (
          <div className={styles.filtersContainer}>
            <div className={styles.filtersWrapper}>
              {/* Left Section: Search */}
              <div className={styles.searchSection}>
                <div className={styles.searchBox}>
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
              </div>

              {/* Right Section: Filters */}
              <div className={styles.filtersSection}>
                <div className={styles.filtersGrid}>
                  <div className={styles.filterGroup}>
                    <label htmlFor="filter-agency" className={styles.filterFieldLabel}>
                      Agency
                    </label>
                    <select
                      id="filter-agency"
                      value={filters.agency_id}
                      onChange={(e) => handleFilterChange('agency_id', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All</option>
                      {filterOptions.agency_id.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label htmlFor="filter-department" className={styles.filterFieldLabel}>
                      Department
                    </label>
                    <select
                      id="filter-department"
                      value={filters.department}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All</option>
                      {filterOptions.department.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  {limitReached && (
                    <button
                      onClick={() => setShowViewedOnly(!showViewedOnly)}
                      className={`${styles.viewedOnlyBtn} ${showViewedOnly ? styles.active : ''}`}
                    >
                      {showViewedOnly ? '✓ ' : ''}Viewed Only
                    </button>
                  )}
                  {(Object.values(filters).some((v) => v) || showViewedOnly) && (
                    <button onClick={() => {
                      clearAllFilters();
                      setShowViewedOnly(false);
                    }} className={styles.clearFiltersBtn}>
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loadingContainer}>
            <p>Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No contacts found</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {DISPLAY_COLUMNS.map((col) => (
                    <th key={col}>{col.replace(/_/g, ' ').toUpperCase()}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedContacts.map((contact, idx) => {
                  const isViewed = viewedContactIds.has(contact.id);
                  const isNewAndLimited = limitReached && !isViewed;
                  
                  return (
                    <tr 
                      key={idx} 
                      className={`${isNewAndLimited ? styles.lockedRow : isViewed ? styles.viewedRow : ''}`}
                    >
                      {DISPLAY_COLUMNS.map((col) => (
                        <td key={col}>
                          {contact[col] || 'N/A'}
                        </td>
                      ))}
                      <td>
                        <button
                          onClick={() => handleViewContact(contact)}
                          className={`${styles.viewButton} ${isNewAndLimited ? styles.lockedButton : ''}`}
                          disabled={isNewAndLimited}
                          title={isNewAndLimited ? 'Daily limit reached. Upgrade to view.' : 'View contact details'}
                        >
                          {isNewAndLimited ? '🔒 Locked' : isViewed ? '👁️ Viewed' : 'View'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
                  onClick={() => handlePageChange(currentPage + 1)}
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
        {selectedContact && (
          <div className={styles.modalOverlay} onClick={() => setSelectedContact(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button
                className={styles.closeButton}
                onClick={() => setSelectedContact(null)}
              >
                ✕
              </button>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {selectedContact.first_name} {selectedContact.last_name}
                </h2>
                {selectedContact.title && (
                  <span className={styles.modalBadge}>{selectedContact.title}</span>
                )}
              </div>
              <div className={styles.modalBody}>
                <div className={styles.modalGrid}>
                  {Object.entries(getDisplayData(selectedContact)).map(([key, value]) => (
                    <div key={key} className={styles.modalItem}>
                      <label className={styles.modalLabel}>
                        {key.charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}
                      </label>
                      <p className={styles.modalValue}>
                        {key === 'email' && value && value !== 'N/A' ? (
                          <a href={`mailto:${value}`} className={styles.modalLink}>
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

        {/* Limit Reached Popup */}
        {showLimitPopup && (
          <div className={styles.modalOverlay} onClick={() => setShowLimitPopup(false)}>
            <div className={styles.limitPopup} onClick={(e) => e.stopPropagation()}>
              <div className={styles.limitPopupIcon}>◆</div>
              <h2 className={styles.limitPopupTitle}>Daily Limit Reached</h2>
              <p className={styles.limitPopupText}>
                You have reached your daily limit of {DAILY_LIMIT} contacts. Your limit resets in{' '}
                <strong>{getTimeUntilReset()}</strong>.
              </p>
              <button
                onClick={() => router.push('/upgrade')}
                className={styles.limitPopupButton}
              >
                Upgrade to Unlock Unlimited
              </button>
              <button
                onClick={() => setShowLimitPopup(false)}
                className={styles.limitPopupButtonSecondary}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Limit Reached Reminder Banner */}
        {limitReached && !showLimitPopup && (
          <div className={styles.limitReminderBanner}>
            <div className={styles.reminderContent}>
              <span className={styles.reminderIcon}>⚠️</span>
              <div className={styles.reminderText}>
                <p className={styles.reminderTitle}>You've reached your daily limit of {DAILY_LIMIT} contacts</p>
                <p className={styles.reminderSubtext}>Your limit resets in {getTimeUntilReset()}</p>
              </div>
              <button
                onClick={() => router.push('/upgrade')}
                className={styles.reminderUpgradeBtn}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
