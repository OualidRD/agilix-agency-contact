'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [navbarBlurred, setNavbarBlurred] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Mouse follow effect for hero
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scroll tracking for animations and navbar blur
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setNavbarBlurred(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [isDarkMode]);

  if (!isLoaded) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (isSignedIn) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className={styles.landingContainer}>
      {/* Animated background gradient */}
      <div className={styles.backgroundGradient}></div>
      <div  className={styles.floatingOrb1}></div>
      <div className={styles.floatingOrb2}></div>

      {/* Navigation */}
      <nav className={`${styles.navbar} ${navbarBlurred ? styles.blurred : ''}`}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>✦</span>
            <span className={styles.logoText}>Agilix</span>
          </div>
          <div className={styles.navLinksContainer}>
            <a href="#features" className={styles.navLink}>
              <span className={styles.navLinkText}>Features</span>
            </a>
            <a href="#benefits" className={styles.navLink}>
              <span className={styles.navLinkText}>Benefits</span>
            </a>
            <a href="#stats" className={styles.navLink}>
              <span className={styles.navLinkText}>Stats</span>
            </a>
          </div>
          <div className={styles.navButtons}>
            <button 
              className={styles.themeToggle}
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
            <Link href="/sign-in" className={styles.signInBtn}>
              Sign In
            </Link>
            <Link href="/sign-up" className={styles.getStartedBtn}>
              Get Started
              <span className={styles.btnArrow}>→</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Discover <span className={styles.gradient}>Unlimited Potential</span> in Your Network
            </h1>
            <p className={styles.heroDescription}>
              Access thousands of professional contacts, build meaningful connections, and grow your network like never before. Smart filtering, real-time updates, and enterprise-grade security.
            </p>
            <div className={styles.heroButtons}>
              <Link href="/sign-up" className={styles.primaryButton}>
                Get Started Free
                <span className={styles.buttonArrow}>→</span>
              </Link>
            </div>
            <div className={styles.trustBadge}>
              <span className={styles.trustIcon}>✓</span>
              <p>Trusted by 5,000+ professionals • 99.9% uptime</p>
            </div>
          </div>

          {/* Animated hero visual */}
          <div className={styles.heroVisual}>
            <div className={styles.visualCard1}>
              <div className={styles.cardHeader}></div>
              <div className={styles.cardBody}>
                <div className={styles.shimmerLine} style={{width: '80%'}}></div>
                <div className={styles.shimmerLine} style={{width: '100%'}}></div>
                <div className={styles.shimmerLine} style={{width: '70%'}}></div>
              </div>
            </div>
            <div className={styles.visualCard2}>
              <div className={styles.chartContainer}>
                <div className={styles.barChart}>
                  <div className={styles.bar} style={{height: '70%'}}></div>
                  <div className={styles.bar} style={{height: '85%'}}></div>
                  <div className={styles.bar} style={{height: '60%'}}></div>
                  <div className={styles.bar} style={{height: '90%'}}></div>
                </div>
              </div>
            </div>
            <div className={styles.visualCard3}>
              <div className={styles.dataDots}>
                <div className={styles.dot} style={{top: '20%', left: '15%'}}></div>
                <div className={styles.dot} style={{top: '50%', left: '40%'}}></div>
                <div className={styles.dot} style={{top: '70%', left: '65%'}}></div>
                <div className={styles.dot} style={{top: '30%', left: '85%'}}></div>
                <svg className={styles.networkLine} viewBox="0 0 200 200">
                  <line x1="30" y1="40" x2="80" y2="100" stroke="rgba(0, 102, 204, 0.3)" strokeWidth="1" />
                  <line x1="80" y1="100" x2="130" y2="140" stroke="rgba(0, 102, 204, 0.3)" strokeWidth="1" />
                  <line x1="130" y1="140" x2="170" y2="60" stroke="rgba(0, 102, 204, 0.3)" strokeWidth="1" />
                </svg>
              </div>
            </div>
            <div className={styles.glowEffect}></div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className={styles.scrollIndicator}>
          <span>Scroll to explore</span>
          <div className={styles.scrollArrow}>↓</div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2>Powerful Features</h2>
          <p>Everything you need to manage your professional network</p>
        </div>

        <div className={styles.featuresGrid}>
          {[
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              ),
              title: 'Smart Search',
              description: 'Find contacts with advanced filters and intelligent search algorithms',
              color: '#0066cc',
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="12" y1="2" x2="12" y2="22"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              ),
              title: 'Real-time Analytics',
              description: 'Track your network growth and engagement with detailed insights',
              color: '#00d084',
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              ),
              title: 'Enterprise Security',
              description: 'Bank-level encryption and compliance with industry standards',
              color: '#ff6b35',
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              ),
              title: 'Lightning Fast',
              description: 'Sub-second response times and optimized performance',
              color: '#ffd60a',
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              ),
              title: 'Collaboration Tools',
              description: 'Share contacts and work seamlessly with your team',
              color: '#7209b7',
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="9" y1="9" x2="15" y2="9"></line>
                  <line x1="9" y1="14" x2="15" y2="14"></line>
                </svg>
              ),
              title: 'Mobile Friendly',
              description: 'Manage your network on the go with our responsive app',
              color: '#00b4d8',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className={styles.featureCard}
              style={{
                transitionDelay: `${idx * 0.1}s`,
                '--feature-color': feature.color,
              } as React.CSSProperties}
            >
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div
                className={styles.featureGlow}
                style={{ backgroundColor: feature.color }}
              ></div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className={styles.benefits}>
        <div className={styles.benefitContent}>
          <div className={styles.benefitText}>
            <h2>Why Choose Agilix?</h2>
            <p className={styles.benefitLead}>
              Join thousands of professionals who have transformed their networking experience
            </p>

            <div className={styles.benefitsList}>
              {[
                'Access 50+ contacts daily with intelligent recommendations',
                'Build lasting relationships with powerful CRM tools',
                'Sync with your existing platforms seamlessly',
                'Get AI-powered insights for better connections',
                'Premium support and dedicated account manager',
              ].map((benefit, idx) => (
                <div key={idx} className={styles.benefitItem}>
                  <span className={styles.benefitCheckmark}>✓</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <Link href="/sign-up" className={styles.primaryButton}>
              Start Your Free Trial
              <span className={styles.buttonArrow}>→</span>
            </Link>
          </div>

          <div className={styles.benefitVisual}>
            <div className={styles.testimonials}>
              <div className={styles.testimonial}>
                <div className={styles.stars}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={styles.star}>★</span>
                  ))}
                </div>
                <p className={styles.testimonialText}>
                  "Found 10 quality leads in my first week. The filtering system actually works."
                </p>
                <p className={styles.testimonialAuthor}>— Marcus Chen, Sales Director</p>
              </div>
              <div className={styles.testimonial}>
                <div className={styles.stars}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={styles.star}>★</span>
                  ))}
                </div>
                <p className={styles.testimonialText}>
                  "Saved me hours every week with smart recommendations. Finally a tool built for professionals."
                </p>
                <p className={styles.testimonialAuthor}>— Sarah Mitchell, HR Manager</p>
              </div>
              <div className={styles.testimonial}>
                <div className={styles.stars}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={styles.star}>★</span>
                  ))}
                </div>
                <p className={styles.testimonialText}>
                  "Real connections, not spam. The quality of contacts is genuinely impressive."
                </p>
                <p className={styles.testimonialAuthor}>— David Torres, Recruiter</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className={styles.stats}>
        <div className={styles.sectionHeader}>
          <h2>By The Numbers</h2>
          <p>Trusted by industry leaders</p>
        </div>

        <div className={styles.statsGrid}>
          {[
            { number: '5,000+', label: 'Active Users' },
            { number: '500K+', label: 'Contacts Connected' },
            { number: '99.9%', label: 'Uptime' },
          ].map((stat, idx) => (
            <div key={idx} className={styles.statCard}>
              <div className={styles.statNumber}>{stat.number}</div>
              <div className={styles.statLabel}>{stat.label}</div>
              <div className={styles.statGlow}></div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className={styles.pricing}>
        <div className={styles.sectionHeader}>
          <h2>Simple, Transparent Pricing</h2>
          <p>Choose the plan that works for you</p>
        </div>

        <div className={styles.pricingCards}>
          {[
            {
              name: 'Free',
              price: '$0',
              description: 'Perfect to get started',
              features: ['50 contacts/day', 'Basic filters', 'Email support'],
              cta: 'Get Started',
              highlighted: false,
            },
            {
              name: 'Pro',
              price: '$29',
              period: '/month',
              description: 'For growing professionals',
              features: [
                'Unlimited contacts',
                'Advanced analytics',
                'Priority support',
                'Custom filters',
                'API access',
              ],
              cta: 'Start Free Trial',
              highlighted: true,
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              description: 'For large teams',
              features: [
                'Everything in Pro',
                'Dedicated account manager',
                'Custom integrations',
                'Team collaboration',
                'SLA guarantee',
              ],
              cta: 'Contact Sales',
              highlighted: false,
            },
          ].map((plan, idx) => (
            <div
              key={idx}
              className={`${styles.pricingCard} ${plan.highlighted ? styles.featured : ''}`}
            >
              {plan.highlighted && <div className={styles.badge}>Most Popular</div>}
              <h3>{plan.name}</h3>
              <div className={styles.priceTag}>
                {plan.price}
                {plan.period && <span>{plan.period}</span>}
              </div>
              <p className={styles.priceDescription}>{plan.description}</p>
              <ul className={styles.featuresList}>
                {plan.features.map((feature, fidx) => (
                  <li key={fidx}>
                    <span className={styles.checkmark}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`${styles.pricingButton} ${plan.highlighted ? styles.primaryBtn : ''}`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2>Ready to Transform Your Network?</h2>
          <p>Join thousands of professionals building meaningful connections every day</p>
          <Link href="/sign-up" className={styles.primaryButton}>
            Start Your Journey Today
            <span className={styles.buttonArrow}>→</span>
          </Link>
        </div>
        <div className={styles.ctaGlow}></div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h4>Agilix</h4>
            <p>The professional network platform for everyone</p>
          </div>
          <div className={styles.footerSection}>
            <h5>Product</h5>
            <ul>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li>
                <a href="#security">Security</a>
              </li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h5>Company</h5>
            <ul>
              <li>
                <a href="#about">About</a>
              </li>
              <li>
                <a href="#blog">Blog</a>
              </li>
              <li>
                <a href="#careers">Careers</a>
              </li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h5>Legal</h5>
            <ul>
              <li>
                <a href="#privacy">Privacy</a>
              </li>
              <li>
                <a href="#terms">Terms</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2025 Agilix. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
