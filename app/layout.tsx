import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { getToken } from "@/lib/auth-server";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Provider } from "react-redux";
import store from "./store";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Axis - Task Management & Time Tracking",
  description: "Manage your tasks, track time, and collaborate with your team",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getToken();
  return (
    <html lang="en" className={figtree.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          <ConvexClientProvider initialToken={token}>
            {/*<NavWebsite />*/}
            <Toaster />
            {children}
          </ConvexClientProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
