'use client';
import { FC } from 'react';

interface StructuredDataProps {
  name: string;
  description: string;
  url: string;
  logoUrl: string;
}

const StructuredData: FC<StructuredDataProps> = ({ name, description, url, logoUrl }) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    provider: {
      '@type': 'Organization',
      name: 'HablaDoc',
      logo: logoUrl
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export default StructuredData;