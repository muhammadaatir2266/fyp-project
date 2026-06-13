'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MobileNav } from '@/components/dashboard/MobileNav';

interface AdminProfile {
  firstName: string;
  lastName: string;
  user: {
    email: string;
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      fetchAdminProfile();
    }
  }, [router]);

  const fetchAdminProfile = async () => {
    try {
      const data = await api.get('/admin/settings/profile');
      setAdminProfile(data);
    } catch (error) {
      console.error('Failed to fetch admin profile:', error);
    }
  };

  const adminName = adminProfile
    ? `${adminProfile.firstName} ${adminProfile.lastName}`
    : 'Admin User';
  const adminEmail = adminProfile?.user.email ?? 'admin@example.com';

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-muted/40">
      {/* Sidebar – desktop only */}
      <div className="hidden md:block">
        <div className="flex h-full max-h-screen flex-col gap-2 sticky top-0">
          <Sidebar adminName={adminName} adminEmail={adminEmail} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 p-4 pb-0">
          <MobileNav adminName={adminName} adminEmail={adminEmail} />
          <span className="text-sm font-semibold text-foreground">Trimed Al Admin</span>
        </div>

        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
