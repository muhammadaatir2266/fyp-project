"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();
  
  // Routes where the Navbar should be hidden
  const hideNavbarRoutes = ["/signup", "/chat"];
  
  const shouldHideNavbar = hideNavbarRoutes.some(route => pathname?.startsWith(route));

  if (shouldHideNavbar) {
    return null;
  }

  return <Navbar />;
}
