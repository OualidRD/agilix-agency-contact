'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import styles from './dashboard.module.css';

interface DashboardMetrics {
  totalAgencies: number;
  totalContacts: number;
}

const DAILY_LIMIT = 50;

// Get storage key for current user and day
const getStorageKey = (userId: string, date: string): string => {
  return `contacts_view_count_${userId}_${date}`;
};

// Get storage key for viewed contacts list
const getViewedContactsKey = (userId: string, date: string): string => {
  return `viewed_contacts_${userId}_${date}`;
};

// Get all viewed contacts for today
const getViewedContacts = (userId: string): any[] => {
  const today = getTodayUTC();
  const key = getViewedContactsKey(userId, today);
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

// Get today's date in UTC format
const getTodayUTC = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Get current view count for today
const getCurrentViewCount = (userId: string): number => {
  const today = getTodayUTC();
  const storageKey = getStorageKey(userId, today);
  const stored = localStorage.getItem(storageKey);
  return stored ? parseInt(stored, 10) : 0;
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

export default function DashboardHome() {
  const router = useRouter();
  const { user } = useUser();
  const [metrics, setMetrics] = useState<DashboardMetrics>({ totalAgencies: 0, totalContacts: 0 });
  const [loading, setLoading] = useState(true);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [viewedContacts, setViewedContacts] = useState<any[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [agenciesRes, contactsRes] = await Promise.all([
          fetch('/api/agencies'),
          fetch('/api/contacts'),
        ]);

        const agencies = agenciesRes.ok ? await agenciesRes.json() : [];
        const contacts = contactsRes.ok ? await contactsRes.json() : [];

        setMetrics({
          totalAgencies: agencies.length,
          totalContacts: contacts.length,
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  useEffect(() => {
    if (user) {
      let usage = getCurrentViewCount(user.id);
      // Cap the usage at 50 (in case old data exists)
      if (usage > DAILY_LIMIT) {
        usage = DAILY_LIMIT;
        const today = getTodayUTC();
        const storageKey = getStorageKey(user.id, today);
        localStorage.setItem(storageKey, DAILY_LIMIT.toString());
      }
      setDailyUsage(usage);
      
      // Load viewed contacts
      const viewed = getViewedContacts(user.id);
      setViewedContacts(viewed);
      
      // Check if limit reached
      if (usage >= DAILY_LIMIT) {
        setLimitReached(true);
      }
    }
  }, [user]);

  // Watch for storage changes (when user views contacts on contacts page)
  useEffect(() => {
    const handleStorageChange = () => {
      if (user) {
        const today = getTodayUTC();
        const storageKey = getStorageKey(user.id, today);
        const stored = localStorage.getItem(storageKey);
        const count = stored ? parseInt(stored, 10) : 0;
        setDailyUsage(Math.min(count, DAILY_LIMIT));
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also poll every second to catch changes in same window
    const interval = setInterval(() => {
      if (user) {
        const today = getTodayUTC();
        const storageKey = getStorageKey(user.id, today);
        const stored = localStorage.getItem(storageKey);
        const count = stored ? parseInt(stored, 10) : 0;
        const finalCount = Math.min(count, DAILY_LIMIT);
        setDailyUsage(finalCount);
        
        // Update viewed contacts and limit status
        const viewed = getViewedContacts(user.id);
        setViewedContacts(viewed);
        
        if (finalCount >= DAILY_LIMIT) {
          setLimitReached(true);
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [user]);

  const progressPercent = dailyUsage > 0 ? (dailyUsage / DAILY_LIMIT) * 100 : 0;
  const remainingViews = Math.max(0, DAILY_LIMIT - dailyUsage);

  return (
    <div>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's your data overview</p>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <p>Loading metrics...</p>
          </div>
        ) : (
          <>
            {/* Quick Stats at Top */}
            <div className={styles.quickStats}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path fillRule="evenodd" d="M3 2.25a.75.75 0 0 0 0 1.5v16.5h-.75a.75.75 0 0 0 0 1.5H15v-18a.75.75 0 0 0 0-1.5H3ZM6.75 19.5v-2.25a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1-.75-.75ZM6 6.75A.75.75 0 0 1 6.75 6h.75a.75.75 0 0 1 0 1.5h-.75A.75.75 0 0 1 6 6.75ZM6.75 9a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75ZM6 12.75a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM10.5 6a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Zm-.75 3.75A.75.75 0 0 1 10.5 9h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM10.5 12a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75ZM16.5 6.75v15h5.25a.75.75 0 0 0 0-1.5H21v-12a.75.75 0 0 0 0-1.5h-4.5Zm1.5 4.5a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Zm.75 2.25a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75v-.008a.75.75 0 0 0-.75-.75h-.008ZM18 17.25a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Agencies</div>
                  <div className={styles.statValue}>{metrics.totalAgencies}</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Total Contacts</div>
                  <div className={styles.statValue}>{metrics.totalContacts}</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Viewed Today</div>
                  <div className={styles.statValue}>{dailyUsage}</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Resets In</div>
                  <div className={styles.statValue}>{getTimeUntilReset()}</div>
                </div>
              </div>
            </div>

            {/* Daily Limit Card */}
            <div className={styles.dailyLimitSection}>
              <div className={styles.limitHeader}>
                <h3>Daily Contact Limit</h3>
                <span className={styles.limitCounter}>
                  {dailyUsage}/{DAILY_LIMIT}
                </span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className={styles.limitInfo}>
                {remainingViews} contacts remaining today
              </p>
              {limitReached && (
                <div className={styles.limitReachedBox}>
                  <strong>
                    Daily Limit Reached
                  </strong>
                  <p>Upgrade to unlock unlimited contacts</p>
                  
                  {/* Viewed Contacts List */}
                  {viewedContacts.length > 0 && (
                    <div className={styles.viewedContactsList}>
                      <h4>Contacts Viewed Today ({viewedContacts.length})</h4>
                      <ul className={styles.contactsList}>
                        {viewedContacts.map((contact, idx) => (
                          <li key={idx} className={styles.contactItem}>
                            <span className={styles.contactName}>
                              {contact.first_name} {contact.last_name}
                            </span>
                            {contact.email && (
                              <span className={styles.contactEmail}>{contact.email}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Link href="/upgrade" className={styles.upgradeLink}>
                    View Plans →
                  </Link>
                </div>
              )}
            </div>

            {/* Main Content Grid */}
            <div className={styles.contentGrid}>
              {/* Metrics Cards */}
              <div className={styles.metricsSection}>
                <h2>Resources</h2>
                <div className={styles.metricsGrid}>
                  <Link href="/dashboard/agencies" className={styles.metricCard}>
                    <div className={styles.metricIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                        <path fillRule="evenodd" d="M3 2.25a.75.75 0 0 0 0 1.5v16.5h-.75a.75.75 0 0 0 0 1.5H15v-18a.75.75 0 0 0 0-1.5H3ZM6.75 19.5v-2.25a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1-.75-.75ZM6 6.75A.75.75 0 0 1 6.75 6h.75a.75.75 0 0 1 0 1.5h-.75A.75.75 0 0 1 6 6.75ZM6.75 9a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75ZM6 12.75a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM10.5 6a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Zm-.75 3.75A.75.75 0 0 1 10.5 9h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM10.5 12a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75ZM16.5 6.75v15h5.25a.75.75 0 0 0 0-1.5H21v-12a.75.75 0 0 0 0-1.5h-4.5Zm1.5 4.5a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Zm.75 2.25a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75v-.008a.75.75 0 0 0-.75-.75h-.008ZM18 17.25a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className={styles.metricLabel}>All Agencies</div>
                    <div className={styles.metricValue}>{metrics.totalAgencies}</div>
                    <p className={styles.metricDescription}>View & search agencies</p>
                  </Link>

                  <Link href="/dashboard/contacts" className={styles.metricCard}>
                    <div className={styles.metricIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className={styles.metricLabel}>All Contacts</div>
                    <div className={styles.metricValue}>{metrics.totalContacts}</div>
                    <p className={styles.metricDescription}>50 per day limit</p>
                  </Link>
                </div>
              </div>

              {/* Features Section */}
              <div className={styles.featuresSection}>
                <h2>Features</h2>
                <div className={styles.featuresList}>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}>✓</span>
                    <div>
                      <strong>Search & Filter</strong>
                      <p>Find agencies and contacts instantly</p>
                    </div>
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}>✓</span>
                    <div>
                      <strong>View Details</strong>
                      <p>Access complete contact information</p>
                    </div>
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}>✓</span>
                    <div>
                      <strong>Daily Limit</strong>
                      <p>50 contacts per day, resets at midnight UTC</p>
                    </div>
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}>✓</span>
                    <div>
                      <strong>Upgrade Available</strong>
                      <p>Unlock unlimited access with Pro plan</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActionsSection}>
              <h2>Quick Actions</h2>
              <div className={styles.actionButtons}>
                <button
                  className={styles.actionButton}
                  onClick={() => router.push('/dashboard/agencies')}
                >
                  <span className={styles.actionIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                      <path fillRule="evenodd" d="M3 2.25a.75.75 0 0 0 0 1.5v16.5h-.75a.75.75 0 0 0 0 1.5H15v-18a.75.75 0 0 0 0-1.5H3ZM6.75 19.5v-2.25a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1-.75-.75ZM6 6.75A.75.75 0 0 1 6.75 6h.75a.75.75 0 0 1 0 1.5h-.75A.75.75 0 0 1 6 6.75ZM6.75 9a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75ZM6 12.75a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM10.5 6a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Zm-.75 3.75A.75.75 0 0 1 10.5 9h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM10.5 12a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75ZM16.5 6.75v15h5.25a.75.75 0 0 0 0-1.5H21v-12a.75.75 0 0 0 0-1.5h-4.5Zm1.5 4.5a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Zm.75 2.25a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75v-.008a.75.75 0 0 0-.75-.75h-.008ZM18 17.25a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className={styles.actionText}>
                    <strong>Browse Agencies</strong>
                    <small>View all {metrics.totalAgencies} agencies</small>
                  </span>
                </button>

                <button
                  className={styles.actionButton}
                  onClick={() => router.push('/dashboard/contacts')}
                >
                  <span className={styles.actionIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className={styles.actionText}>
                    <strong>View Contacts</strong>
                    <small>{remainingViews} remaining today</small>
                  </span>
                </button>

                <button
                  className={styles.actionButton}
                  onClick={() => router.push('/upgrade')}
                >
                  <span className={styles.actionIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                      <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className={styles.actionText}>
                    <strong>Upgrade Plan</strong>
                    <small>Get unlimited access</small>
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
