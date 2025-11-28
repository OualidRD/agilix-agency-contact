'use client';

import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import styles from './upgrade.module.css';

export default function UpgradePage() {
  const router = useRouter();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'Forever',
      description: 'Perfect for getting started',
      features: [
        '50 contacts per day',
        'All agencies access',
        'Search and filter',
        'View contact details',
        'Basic support',
      ],
      cta: 'Current Plan',
      ctaVariant: 'current',
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      description: 'For power users',
      features: [
        'Unlimited contacts',
        'All agencies access',
        'Advanced search & filters',
        'Export data (CSV, PDF)',
        'Email notifications',
        'Priority support',
        'API access',
      ],
      cta: 'Coming Soon',
      ctaVariant: 'primary',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'Let\'s talk',
      description: 'For large organizations',
      features: [
        'Unlimited everything',
        'Custom integrations',
        'Dedicated account manager',
        'Advanced analytics',
        'Data governance',
        'SLA guarantee',
        'Custom training',
      ],
      cta: 'Contact Sales',
      ctaVariant: 'secondary',
    },
  ];

  return (
    <div>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            ← Back
          </button>
          <div className={styles.headerContent}>
            <h1>Choose Your Plan</h1>
            <p>Unlock unlimited access and powerful features</p>
          </div>
        </div>

        <div className={styles.pricingContainer}>
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`${styles.planCard} ${plan.popular ? styles.popular : ''}`}
            >
              {plan.popular && <div className={styles.popularBadge}>Most Popular</div>}

              <div className={styles.planHeader}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <p className={styles.planDescription}>{plan.description}</p>
              </div>

              <div className={styles.pricing}>
                <span className={styles.price}>{plan.price}</span>
                <span className={styles.period}>{plan.period}</span>
              </div>

              <ul className={styles.featuresList}>
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className={styles.featureItem}>
                    <span className={styles.checkmark}>✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`${styles.ctaButton} ${styles[`cta-${plan.ctaVariant}`]}`}
                onClick={() => {
                  if (plan.ctaVariant === 'secondary') {
                    window.location.href = 'mailto:sales@agilix.com';
                  }
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <div className={styles.infoBadge}>Free Plan Limits</div>
            <p>50 contacts per day • Resets at midnight UTC • No credit card required</p>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoBadge}>Pro Benefits</div>
            <p>Unlimited contacts • Export to CSV/PDF • API access • Priority support</p>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoBadge}>Questions?</div>
            <p>Email us at <a href="mailto:sales@agilix.com">sales@agilix.com</a> for more info</p>
          </div>
        </div>
      </div>
    </div>
  );
}
