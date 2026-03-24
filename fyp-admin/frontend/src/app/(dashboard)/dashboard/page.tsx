'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Key, Activity, TrendingUp, Clock, UserCheck, ArrowRight } from 'lucide-react';
import type { DashboardStats } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.get('/admin/dashboard/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Doctors',
      value: stats?.totalDoctors || 0,
      subtitle: `${stats?.activeDoctors || 0} active, ${stats?.pendingDoctors || 0} pending`,
      icon: Users,
      gradient: 'from-blue-500 via-blue-600 to-indigo-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      trend: `${stats?.pendingDoctors || 0} awaiting approval`,
    },
    {
      title: 'Total Patients',
      value: stats?.totalPatients || 0,
      subtitle: 'Registered users',
      icon: UserCheck,
      gradient: 'from-emerald-500 via-teal-600 to-cyan-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      trend: '+8%',
    },
    {
      title: 'Total Appointments',
      value: stats?.totalAppointments || 0,
      subtitle: `${stats?.pendingAppointments || 0} pending`,
      icon: Calendar,
      gradient: 'from-purple-500 via-purple-600 to-pink-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      trend: '+23%',
    },
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      subtitle: 'Scheduled today',
      icon: Clock,
      gradient: 'from-orange-500 via-amber-600 to-yellow-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      trend: '+5',
    },
    {
      title: 'Active API Tokens',
      value: stats?.activeApiTokens || 0,
      subtitle: 'External access',
      icon: Key,
      gradient: 'from-teal-500 via-cyan-600 to-blue-600',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      trend: '2 new',
    },
    {
      title: 'API Calls Today',
      value: stats?.apiCallsToday || 0,
      subtitle: `${stats?.totalApiCalls || 0} total`,
      icon: Activity,
      gradient: 'from-pink-500 via-rose-600 to-red-600',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
      trend: '+156',
    },
  ];

  const quickActions = [
    {
      href: '/doctors',
      icon: Users,
      title: 'Manage Doctors',
      description: 'Add, edit, or deactivate doctor profiles',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      href: '/appointments',
      icon: Calendar,
      title: 'View Appointments',
      description: 'Monitor and manage all bookings',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      href: '/api-access',
      icon: Key,
      title: 'API Tokens',
      description: 'Generate tokens for external systems',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      href: '/api-logs',
      icon: Activity,
      title: 'API Logs',
      description: 'Track calling agent activity',
      gradient: 'from-orange-500 to-amber-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-600 border-t-transparent absolute top-0"></div>
        </div>
        <p className="mt-4 text-gray-600 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-2 text-lg">Welcome back! Here's what's happening today.</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} variants={item}>
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                    <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                      <TrendingUp className="h-4 w-4" />
                      <span>{stat.trend}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Quick Actions</CardTitle>
            <p className="text-gray-600 text-sm">Jump to frequently used sections</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.a
                    key={action.href}
                    href={action.href}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative p-6 rounded-xl border-2 border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <Icon className="h-8 w-8 text-teal-600 group-hover:text-white transition-colors" />
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-white transition-colors mb-1">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors">
                        {action.description}
                      </p>
                    </div>
                  </motion.a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
