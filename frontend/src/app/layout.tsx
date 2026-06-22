import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

// Body text. IBM Plex Sans is a variable font, so no explicit weights needed.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Monospace, used for addresses, hashes and small caps labels. Plex Mono is
// not a variable font, so weights must be listed explicitly.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Display font for the brand mark and headings.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Veridel — Blockchain Delivery Management",
  description:
    "A delivery ledger no single party can alter. Create, dispatch, track and confirm deliveries with a verifiable on-chain history.",
};

/**
 * Root layout. Loads the Veridel fonts, applies global styles, and wraps the
 * whole app in the AuthProvider so every screen can read the current session.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
