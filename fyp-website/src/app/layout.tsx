import type { Metadata } from "next";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";
import RootLayoutShell from "@/components/RootLayoutShell";

export const metadata: Metadata = {
  title: "DocLink",
  description: "Your Personal AI Health Companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <RootLayoutShell>
          <NavbarWrapper />
          {children}
        </RootLayoutShell>
      </body>
    </html>
  );
}
