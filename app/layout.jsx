import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GA4 Analytics Dashboard',
  description: 'Real-time Google Analytics 4 dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 antialiased`}>{children}</body>
    </html>
  )
}
