import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/layout/shell";
import { UserProvider } from "@/providers/user-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POZ Social Media Agent",
  description: "AI-powered social media post generation and workflow management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* POZ carousel slide fonts — Bebas Neue (display) + Inter (body) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <UserProvider>
            <Shell>{children}</Shell>
            <Toaster />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
