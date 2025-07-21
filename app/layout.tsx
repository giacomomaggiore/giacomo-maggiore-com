

import './global.css'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Navbar } from './components/nav'
import Footer from './components/footer'
import { baseUrl } from './sitemap'

import './instrumentation-client' // Importa il file JS che inizializza PostHog

import { GoogleAnalytics } from '@next/third-parties/google'
 



            


export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Giacomo Maggiore',
    template: '%s | Giacomo Maggiore',
  },
  icons: {icon : '/icon.png'},
  description: 'Giacomo Maggiore Portfolio and personal website',
  openGraph: {
    title: 'Giacomo Maggiore',
    description: 'Giacomo Maggiore Portfolio and personal website.',
    url: baseUrl,
    siteName: 'Giacomo Maggiore',
    locale: 'en_US',
    type: 'website',
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
}

const cx = (...classes: string[]) => classes.filter(Boolean).join(' ')

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={cx(
        'text-black bg-white dark:text-white dark:bg-black',
        GeistSans.variable,
        GeistMono.variable
      )}
    >
      <GoogleAnalytics gaId="G-6E5X8EMEPL" />
      <body className="antialiased max-w-2xl mx-4 mt-8 lg:mx-auto">
          <main className="flex-auto min-w-0 mt-6 flex flex-col px-2 md:px-0">
            <Navbar />
            {children}
            <Footer />
          </main>
      </body>
      
    </html>
  )
}