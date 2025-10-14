import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PrivacyPDF - Secure PDF Masking Tool",
  description: "Privacy-first PDF redaction tool with client-side processing. Mask sensitive information in PDF documents securely in your browser. No uploads, no tracking, 100% private.",
  keywords: [
    "PDF masking",
    "PDF redaction",
    "document privacy",
    "sensitive information protection",
    "client-side PDF processing",
    "secure PDF editor",
    "PDF watermark",
    "online PDF tool",
    "privacy protection",
    "document security",
    "GDPR compliant",
    "no upload PDF editor",
    "browser-based PDF tool",
    "confidential document redaction"
  ],
  authors: [{ name: "Pons", url: "https://ponslink.online" }],
  creator: "Pons",
  publisher: "PrivacyPDF",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["ko_KR", "ja_JP", "zh_CN", "es_ES", "fr_FR"],
    url: "https://ppdf.ponslink.online",
    siteName: "PrivacyPDF",
    title: "PrivacyPDF - Secure PDF Masking Tool",
    description: "Protect sensitive information in PDF documents with our privacy-first masking tool. All processing happens locally in your browser - your documents never leave your device.",
    images: [
      {
        url: "https://ppdf.ponslink.online/public/og-image.png",
        width: 1200,
        height: 630,
        alt: "PrivacyPDF - Secure PDF Masking Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@ponslink",
    creator: "@ponslink",
    title: "PrivacyPDF - Secure PDF Masking Tool",
    description: "🔒 Mask sensitive info in PDFs without uploading to the cloud. 100% browser-based, 100% private.",
    images: ["https://ppdf.ponslink.online/public/twitter-image.png"],
  },
  alternates: {
    canonical: "https://ppdf.ponslink.online",
    languages: {
      'en': 'https://ppdf.ponslink.online/en',
      'ko': 'https://ppdf.ponslink.online/ko',
      'ja': 'https://ppdf.ponslink.online/ja',
      'zh-CN': 'https://ppdf.ponslink.online/zh-CN',
      'es': 'https://ppdf.ponslink.online/es',
      'fr': 'https://ppdf.ponslink.online/fr',
    },
  },
  category: "productivity",
  applicationName: "PrivacyPDF",
  appleWebApp: {
    capable: true,
    title: "PrivacyPDF",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  verification: {
    // Google Search Console 인증 (실제 코드로 교체 필요)
    google: "your-google-verification-code",
    // Bing Webmaster Tools 인증 (선택사항)
    // other: "your-bing-verification-code",
  },
  icons: {
    icon: [
      { url: "/public/favicon.ico", sizes: "any" },
      { url: "/public/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/public/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/public/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/public/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch for faster loading */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        
        {/* Theme Color for mobile browsers */}
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
        
        {/* Additional SEO tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        {/* Security headers */}
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
        
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "PrivacyPDF",
              "description": "Privacy-first PDF redaction tool with client-side processing. Mask sensitive information securely in your browser.",
              "url": "https://ppdf.ponslink.online",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "Client-side PDF processing",
                "Interactive masking",
                "Watermark support",
                "Multi-language interface",
                "No data collection",
                "No tracking"
              ],
              "browserRequirements": "Requires JavaScript. Requires HTML5.",
              "softwareVersion": "1.0.0",
              "author": {
                "@type": "Person",
                "name": "Pons",
                "url": "https://ppdf.ponslink.online"
              },
              "provider": {
                "@type": "Organization",
                "name": "PrivacyPDF",
                "url": "https://ppdf.ponslink.online"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
