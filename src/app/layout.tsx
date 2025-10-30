import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { MenuItemsProvider } from "@/contexts/MenuItemsContext";
import { OrdersProvider } from "@/contexts/OrdersContext";
import FirestoreDiagnostics from "@/components/diagnostics/FirestoreDiagnostics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Biryani Sales Manager",
  description: "Manage your biryani takeaway business with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <MenuItemsProvider>
            <OrdersProvider>
              {children}

              {/* Firestore Diagnostics - Only shows in development */}
              {process.env.NODE_ENV === 'development' && <FirestoreDiagnostics />}
            </OrdersProvider>
          </MenuItemsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
