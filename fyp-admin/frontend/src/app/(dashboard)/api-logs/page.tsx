'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ApiLog {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ipAddress: string;
  createdAt: string;
  token: {
    name: string;
  };
}

export default function ApiLogsPage() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await api.get('/admin/api-logs?limit=100');
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-100 text-green-800';
    if (statusCode >= 400 && statusCode < 500) return 'bg-yellow-100 text-yellow-800';
    if (statusCode >= 500) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-800',
      POST: 'bg-green-100 text-green-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      PATCH: 'bg-purple-100 text-purple-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API Logs</h1>
        <p className="text-gray-600 mt-1">Monitor all API calls and calling agent activity</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-teal-600" />
            <span className="font-semibold">Recent API Activity</span>
            <Badge variant="secondary">{logs.length} calls</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
              >
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge className={getMethodColor(log.method)}>
                        {log.method}
                      </Badge>
                      <Badge className={getStatusColor(log.statusCode)}>
                        {log.statusCode >= 200 && log.statusCode < 300 ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {log.statusCode}
                      </Badge>
                    </div>

                    <div className="flex-1">
                      <div className="font-mono text-sm font-medium">{log.endpoint}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Token: {log.token.name} • IP: {log.ipAddress || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {format(new Date(log.createdAt), 'MMM dd, hh:mm a')}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {logs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>No API logs yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
