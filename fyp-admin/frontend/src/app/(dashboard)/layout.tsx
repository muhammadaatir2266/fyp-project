'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, removeAuthToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Key, 
  FileText, 
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Book,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctors', label: 'Doctors', icon: Users },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/api-access', label: 'API Access', icon: Key },
  { href: '/api-logs', label: 'API Logs', icon: FileText },
  { href: '/api-docs', label: 'Doctor API Docs', icon: Book },
  { href: '/ml-api-docs', label: 'ML API Docs', icon: Brain },
  { href: '/settings', label: 'Settings', icon: Settings },
];

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const handleLogout = () => {
    removeAuthToken();
    router.push('/login');
  };

  const getInitials = () => {
    if (!adminProfile) return 'A';
    return `${adminProfile.firstName.charAt(0)}${adminProfile.lastName.charAt(0)}`.toUpperCase();
  };

  const getFullName = () => {
    if (!adminProfile) return 'Admin User';
    return `${adminProfile.firstName} ${adminProfile.lastName}`;
  };

  const getEmail = () => {
    if (!adminProfile) return 'admin@example.com';
    return adminProfile.user.email;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-72 md:flex-col z-50">
        <div className="flex flex-col flex-grow bg-white shadow-2xl overflow-y-auto border-r border-gray-200">
          {/* Logo */}
          <Link href={process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000"} className="flex items-center flex-shrink-0 px-6 py-6 border-b border-gray-200">
            <div className="w-10 h-10 rounded-xl overflow-hidden mr-3 shadow-lg">
              <img src="/logo.png" alt="Trimed Al" className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Trimed Al
              </h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative"
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-teal-600'}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </motion.div>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-500 to-emerald-600 rounded-r-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="flex items-center mb-3 px-3 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                {getInitials()}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-gray-900">{getFullName()}</p>
                <p className="text-xs text-gray-600">{getEmail()}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-lg px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <Link href={process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000"} className="flex items-center">
          <div className="w-8 h-8 rounded-lg overflow-hidden mr-2">
            <img src="/logo.png" alt="Trimed Al" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Trimed Al
          </h1>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-700 hover:bg-gray-100"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Mobile Logo */}
                <Link href={process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000"} className="flex items-center px-6 py-6 border-b border-gray-200">
                  <div className="w-10 h-10 rounded-xl overflow-hidden mr-3">
                    <img src="/logo.png" alt="Trimed Al" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                      Trimed Al
                    </h1>
                    <p className="text-xs text-gray-500">Admin Panel</p>
                  </div>
                </Link>

                {/* Mobile Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                {/* Mobile User Section */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center mb-3 px-3 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                      {getInitials()}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-semibold text-gray-900">{getFullName()}</p>
                      <p className="text-xs text-gray-600">{getEmail()}</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="md:pl-72 flex flex-col flex-1">
        <main className="flex-1 pt-16 md:pt-0">
          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
