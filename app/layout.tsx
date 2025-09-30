import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { LoadingProvider } from "../context/LoadingContext";
import { AuthProvider } from "../context/AuthContext";
import { Inter, Poppins } from "next/font/google";

/* Font setup */
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

/* ────────────────────────────────────────────────────────────
   • Metadata
   ──────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "Extranetsync | Hotel Channel Management",
  description:
    "Transform hotel operations with intelligent channel synchronization. Real-time booking management, rate optimisation, and multi-channel distribution—all in one platform.",
  metadataBase: new URL("https://extranetsync.com"),
  keywords: [
    "hotel channel manager",
    "hotel booking software",
    "channel management",
    "hotel inventory",
    "OTA sync",
    "rate optimisation",
    "property management system",
    "hotel tech",
    "booking engine",
    "revenue management",
  ],
  openGraph: {
    title: "Extranetsync | Hotel Channel Management",
    description:
      "Transform hotel operations with intelligent channel synchronization. Real-time booking management, rate optimisation, and multi-channel distribution—all in one platform.",
    url: "https://extranetsync.com",
    siteName: "Extranetsync",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/assets/extranetsync-full-logo.png",
        width: 1200,
        height: 630,
        alt: "Extranetsync – Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Extranetsync | Hotel Channel Management",
    description:
      "Transform hotel operations with intelligent channel synchronization.",
    images: ["/assets/extranetsync-full-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/* ────────────────────────────────────────────────────────────
   • Viewport / theme-colour
   ──────────────────────────────────────────────────────────── */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" }, // black
    { media: "(prefers-color-scheme: dark)", color: "#111827" },  // gray-900
  ],
};

/* ────────────────────────────────────────────────────────────
   • Root layout
   ──────────────────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} antialiased scroll-smooth`}
    >
      <body
        className={`${inter.className} bg-white text-gray-900 selection:bg-gray-800/90 selection:text-white`}
      >
        <LoadingProvider>
          <AuthProvider>
            {children}

            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 2000,
                style: {
                  background: "#111827", // gray-900
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "10px",
                  fontSize: "14px",
                  fontWeight: "600",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: "#ffffff", // green-700
                    secondary: "#15803d",
                  },
                  style: { background: "#15803d" },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: "#ffffff", // red-700
                    secondary: "#b91c1c",
                  },
                  style: { background: "#b91c1c" },
                },
                loading: {
                  iconTheme: {
                    primary: "#ffffff", // gray-500
                    secondary: "#6b7280",
                  },
                },
              }}
            />
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
