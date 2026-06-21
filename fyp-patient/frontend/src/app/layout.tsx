import type { Metadata } from "next";
import "./globals.css";
import AuthSync from "@/components/AuthSync";

export const metadata: Metadata = {
  title: "DocLink - Patient Portal",
  description:
    "AI-Powered Virtual Medical Assistant and Smart Doctor Calling Agent",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthSync />
        {children}
      </body>
    </html>
  );
}
