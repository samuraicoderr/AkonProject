import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AkonProject — AI Crop Intelligence",
  description:
    "Discover the ideal crop for your soil and climate. Powered by machine learning with 99.77% accuracy.",
  keywords: [
    "crop recommendation",
    "farming",
    "agriculture",
    "AI",
    "machine learning",
    "soil analysis",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
