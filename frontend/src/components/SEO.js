import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'CareFD';
const SITE_URL = 'https://carefd.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

/**
 * SEO Component - manages meta tags per page
 * Usage: <SEO title="..." description="..." />
 */
const SEO = ({
  title,
  description,
  canonical,
  type = 'website',
  image = DEFAULT_IMAGE,
  noindex = false,
  jsonLd,
  children
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - שירותי בריאות וסיעוד בישראל`;
  const metaDescription = description || 'CareFD מחברת בין מטופלים לספקי שירותי בריאות וסיעוד מובילים בישראל. מטפלים סיעודיים, אחיות פרטיות, טיפול בבית ועוד.';
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />

      {/* Canonical */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* OpenGraph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="he_IL" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {image && <meta name="twitter:image" content={image} />}

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}

      {children}
    </Helmet>
  );
};

/**
 * Generate Organization schema (for homepage)
 */
export const organizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'CareFD',
  url: SITE_URL,
  logo: `${SITE_URL}/logo512.png`,
  description: 'פלטפורמה מובילה בישראל לחיבור בין מטופלים לספקי שירותי בריאות וסיעוד',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['Hebrew', 'English', 'Arabic', 'Russian']
  },
  sameAs: [],
  areaServed: {
    '@type': 'Country',
    name: 'Israel'
  }
});

/**
 * Generate MedicalBusiness schema (for homepage)
 */
export const medicalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  name: 'CareFD',
  url: SITE_URL,
  description: 'שירותי בריאות וסיעוד בישראל - מטפלים סיעודיים, אחיות פרטיות, טיפול בבית',
  priceRange: '₪₪',
  areaServed: {
    '@type': 'Country',
    name: 'Israel'
  },
  availableService: [
    { '@type': 'MedicalTherapy', name: 'טיפול סיעודי בבית', description: 'שירותי סיעוד מקצועיים בבית המטופל' },
    { '@type': 'MedicalTherapy', name: 'אחות פרטית', description: 'שירותי אחות פרטית לטיפול ומעקב רפואי' },
    { '@type': 'MedicalTherapy', name: 'השגחה פרטית', description: 'שירותי השגחה ומטפל צמוד' },
    { '@type': 'MedicalTherapy', name: 'טיפול לקשישים', description: 'שירותי טיפול וליווי לקשישים' }
  ]
});

/**
 * Generate Provider (Person) schema
 */
export const providerSchema = (provider) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: provider.business_name,
    url: `${SITE_URL}/providers/${provider.provider_id}`,
    jobTitle: provider.profession_title || provider.specialization_name || 'ספק שירותי בריאות',
    description: provider.about || provider.description || '',
    address: provider.location ? {
      '@type': 'PostalAddress',
      addressLocality: provider.location.city || '',
      addressCountry: 'IL'
    } : undefined,
    knowsLanguage: provider.languages || []
  };

  if (provider.profile_image) {
    schema.image = provider.profile_image.startsWith('http')
      ? provider.profile_image
      : `${SITE_URL}${provider.profile_image}`;
  }

  if (provider.rating && provider.total_reviews > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(provider.rating).toFixed(1),
      bestRating: '5',
      worstRating: '1',
      ratingCount: provider.total_reviews
    };
  }

  return schema;
};

/**
 * Generate Service schema
 */
export const serviceSchema = (service, provider) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: service.title || service.name,
  description: service.description || '',
  url: `${SITE_URL}/book/${service.service_id || service._id}`,
  provider: (provider || service.provider) ? {
    '@type': 'Person',
    name: (provider || service.provider).business_name,
    url: `${SITE_URL}/providers/${(provider || service.provider).provider_id}`
  } : undefined,
  areaServed: {
    '@type': 'Country',
    name: 'Israel'
  },
  offers: service.price ? {
    '@type': 'Offer',
    price: service.price,
    priceCurrency: 'ILS'
  } : undefined
});

/**
 * Generate BreadcrumbList schema
 */
export const breadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url ? `${SITE_URL}${item.url}` : undefined
  }))
});

/**
 * Generate FAQPage schema
 */
export const faqSchema = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
});

export { SITE_NAME, SITE_URL };
export default SEO;
