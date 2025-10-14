import { MetadataRoute } from 'next'

/**
 * 동적 robots.txt 생성
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/static/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 0,
      },
    ],
    sitemap: 'https://ppdf.ponslink.online/sitemap.xml',
  }
}