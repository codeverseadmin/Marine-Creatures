import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CustomCursor } from '@/components/ui/Cursor';
import { SmoothScroll } from '@/components/layout/SmoothScroll';
import { SITE_CONFIG } from '@/lib/config';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  metadataBase: new URL(SITE_CONFIG.url),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    images: [
      {
        url: '/og-image.jpg',
        width: 1024,
        height: 1024,
        alt: 'Marine Creatures — Bringing Ocean At Your Door Step',
      },
    ],
  },
  alternates: {
    canonical: '/',
  },
  keywords: [
    'Marine Creatures',
    'Bringing ocean at your door step',
    'Exotic Marine Fish India',
    'Captive-Bred Marine Life',
    'Clownfish Pairs India',
    'Bespoke Aquarium Design Kolkata',
    'Reef Tank Installation India',
    'Live Marine Cargo Dispatch',
    'Custom Living Coral Reefs',
    'Museum Grade Acrylic Aquariums',
    'Suraj Shasmal Marine Creatures',
  ],
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import { CatalogProvider } from '@/lib/context/CatalogContext';
import { CartProvider } from '@/lib/context/CartContext';
import { ThemeProvider } from '@/lib/context/ThemeContext';
import { WishlistProvider } from '@/lib/context/WishlistContext';
import { OrderProvider } from '@/lib/context/OrderContext';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { WishlistDrawer } from '@/components/wishlist/WishlistDrawer';
import { OrderTrackingModal } from '@/components/orders/OrderTrackingModal';
import { FounderConciergePill } from '@/components/ui/FounderConciergePill';
import { FlyToCartEffect } from '@/components/cart/FlyToCartEffect';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_CONFIG.url}/#website`,
        url: SITE_CONFIG.url,
        name: SITE_CONFIG.name,
        description: SITE_CONFIG.description,
        publisher: {
          '@id': `${SITE_CONFIG.url}/#organization`,
        },
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${SITE_CONFIG.url}/#organization`,
        name: SITE_CONFIG.name,
        alternateName: 'Marine Creatures Aquatics Private Limited',
        url: SITE_CONFIG.url,
        logo: `${SITE_CONFIG.url}/logo.jpg`,
        image: `${SITE_CONFIG.url}/og-image.jpg`,
        description: SITE_CONFIG.description,
        slogan: SITE_CONFIG.slogan,
        telephone: SITE_CONFIG.phone,
        email: SITE_CONFIG.email,
        founder: {
          '@type': 'Person',
          name: SITE_CONFIG.founder,
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Registered Aquaculture Studio',
          addressLocality: 'Kolkata',
          addressRegion: 'West Bengal',
          addressCountry: 'IN',
        },
        priceRange: '₹₹₹₹',
        sameAs: [SITE_CONFIG.facebook, SITE_CONFIG.googleMaps],
      },
    ],
  };

  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {/* Subtle grain overlay for texture */}
        <div className="grain-overlay" aria-hidden="true" />

        <ThemeProvider>
          <CatalogProvider>
            <CartProvider>
              <WishlistProvider>
                <OrderProvider>
                  <SmoothScroll>
                    <CustomCursor />
                    <FlyToCartEffect />
                    <CartDrawer />
                    <WishlistDrawer />
                    <OrderTrackingModal />
                    <Navbar />
                    <main className="min-h-screen pb-16 md:pb-0">{children}</main>
                    <FounderConciergePill />
                    <MobileBottomNav />
                    <Footer />
                  </SmoothScroll>
                </OrderProvider>
              </WishlistProvider>
            </CartProvider>
          </CatalogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


