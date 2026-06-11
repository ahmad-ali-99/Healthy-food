import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Million Image Gallery — Own a piece of the internet",
  description:
    "Buy one of 1,000,000 image slots for just $0.50. Upload your image and become part of internet history.",
  openGraph: {
    title: "Million Image Gallery",
    description: "1,000,000 image slots — $0.50 each",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
