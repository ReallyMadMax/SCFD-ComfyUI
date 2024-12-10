// app/layout.js
import '@/app/globals.css'  // Make sure this file exists

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-900">{children}</body>
    </html>
  );
}