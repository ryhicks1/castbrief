import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const icons = {
  icon: "/favicon.svg",
};

export const metadata: Metadata = {
  title: "CastBrief — Talent Packaging Platform",
  description:
    "Send curated talent packages to clients. Collect self-tapes via Dropbox. Manage your entire casting workflow.",
  openGraph: {
    title: "CastBrief — Talent Packaging Platform",
    description:
      "Send curated talent packages to clients. Collect self-tapes via Dropbox. Manage your entire casting workflow.",
    type: "website",
    url: "https://castbrief.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
