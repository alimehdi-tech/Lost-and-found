import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "UMT Lost & Found Portal",
  description: "A comprehensive lost and found portal for University of Management and Technology students and staff",
  keywords: "lost, found, UMT, university, students, items, recovery",
  authors: [{ name: "UMT IT Department" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <AuthProvider>
          <NotificationProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
