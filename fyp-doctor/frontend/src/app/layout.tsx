import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocLink - Doctor Portal",
  description: "AI-Powered Virtual Medical Assistant - Doctor Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
