import { Inter } from 'next/font/google'; // Importing Google Font 'Inter'
import './globals.css'; // Importing global CSS styles

// Initialize the 'Inter' font with 'latin' subset
const inter = Inter({ subsets: ['latin'] });

// Metadata for your application (used for SEO and browser tabs)
export const metadata = {
  title: 'InterviewAce', // Title that appears in browser tab
  description: 'Your Personal AI Interview Coach', // Description for search engines
};

// RootLayout component defines the basic HTML structure for your application
export default function RootLayout({ children }) {
  return (
    <html lang="en"> {/* Sets the language of the document to English */}
      <body className={inter.className}> {/* Applies the 'Inter' font to the body */}
        {children} {/* This is where your page content will be rendered */}
      </body>
    </html>
  );
}