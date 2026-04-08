import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "We Invest — Recherche immobilière",
  description: "Trouvez votre bien immobilier en Belgique. Recherche interactive sur carte avec filtres avancés.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <body
        className={inter.variable}
        style={{ display: "flex", flexDirection: "column", fontFamily: "var(--font-inter), sans-serif" }}
      >
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
