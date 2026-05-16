import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "startupZconnect | The #1 Platform for Startups",
  description: "Discover innovative startups, collaborate with visionary founders, find top-tier jobs, and unlock exclusive investment opportunities.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <div className="pt-16 min-h-screen">{children}</div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
