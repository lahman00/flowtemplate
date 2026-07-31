import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "Flowtemplate — Find the right software alternatives";
const description =
  "Compare software alternatives, pricing, features, and migration options in one place — so you can switch with confidence.";

export const metadata: Metadata = {
  title: {
    default: title,
    template: "%s | Flowtemplate",
  },
  description,
  keywords: [
    "software alternatives",
    "software comparison",
    "compare software",
    "switch software",
  ],
  openGraph: {
    title,
    description,
    siteName: "Flowtemplate",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-zinc-950 font-sans text-white antialiased">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
