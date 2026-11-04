import type { Metadata, Viewport } from "next";
import { Figtree, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { SvgDefs } from "@/components/icons/Icons";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brunch · Made for fun. Found here.",
  description: "A showcase and discovery board for small games, apps and tools made for fun.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${figtree.variable} ${bricolage.variable}`}>
      <head>
        <meta name="claude:viewport-fit-sides" content="cover" />
      </head>
      <body>
        <SvgDefs />
        {children}
      </body>
    </html>
  );
}
