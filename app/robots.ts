import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    SITE_CONFIG.url ||
    'https://www.marinecreatures.co.in'
  ).replace(/\/$/, '');

  const disallowList = [
    '/admin',
    '/admin/*',
    '/invoice',
    '/invoice/*',
    '/api/*',
    '/checkout',
    '/checkout/*',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowList,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: disallowList,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: disallowList,
      },
      // Explicit AI Answer Engine & Citation Retrieval Directives (AEO)
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: disallowList,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: disallowList,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: disallowList,
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: disallowList,
      },
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
        disallow: disallowList,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
