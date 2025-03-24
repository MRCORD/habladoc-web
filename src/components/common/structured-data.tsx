'use client';
import { FC } from 'react';

interface StructuredDataProps {
  name: string;
  description: string;
  url: string;
  logoUrl: string;
}

const StructuredData: FC<StructuredDataProps> = ({ name, description, url, logoUrl }) => {
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` 
    : 'http://localhost:3000';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    url: url || baseUrl,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    provider: {
      '@type': 'Organization',
      name: 'HablaDoc',
      logo: logoUrl || `${baseUrl}/icons/logo.svg`
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