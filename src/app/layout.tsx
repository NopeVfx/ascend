import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AppShell } from "@/components/shell/AppShell";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ascend — Looksmaxxing, AI Analysis & Peer Advice",
  description:
    "Data-driven aesthetic optimization. Get an unsugarcoated AI face analysis, ascension advice, and peer-to-peer video advice.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

const NO_FLASH = `(function(){try{var t=localStorage.getItem('ascend-theme')||'dark';var p='default',m;if(t==='system'){m=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}else if(t==='light'||t==='dark'){m=t;}else{var i=t.lastIndexOf('-');if(i>0){p=t.slice(0,i);m=t.slice(i+1);}else{m='dark';}}var r=document.documentElement;r.setAttribute('data-theme',p);if(m==='dark'){r.classList.add('dark');}else{r.classList.remove('dark');}}catch(e){var r=document.documentElement;r.setAttribute('data-theme','default');r.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      </head>
      <body className="min-h-full antialiased">
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
