'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Key, 
  Copy, 
  Trash2, 
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';

interface ApiToken {
  id: string;
  name: string;
  token: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  admin: {
    firstName: string;
    lastName: string;
  };
  _count: {
    apiLogs: number;
  };
}

export default function ApiAccessPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenExpiry, setNewTokenExpiry] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const data = await api.get('/admin/api-tokens');
      setTokens(data);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const createToken = async () => {
    try {
      const response = await api.post('/admin/api-tokens', {
        name: newTokenName,
        expiresInDays: newTokenExpiry ? parseInt(newTokenExpiry) : null,
      });
      setCreatedToken(response.token);
      setNewTokenName('');
      setNewTokenExpiry('');
      fetchTokens();
    } catch (error) {
      console.error('Failed to create token:', error);
    }
  };

  const revokeToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this token?')) return;
    
    try {
      await api.delete(`/admin/api-tokens/${tokenId}`);
      fetchTokens();
    } catch (error) {
      console.error('Failed to revoke token:', error);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Access Management</h1>
          <p className="text-gray-600 mt-1">Generate and manage API tokens for external systems</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Generate Token
        </Button>
      </div>

      {/* Create Token Modal */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !createdToken && setShowCreateModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            {!createdToken ? (
              <>
                <h2 className="text-xl font-bold mb-4">Generate New API Token</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Token Name</label>
                    <Input
                      placeholder="e.g., Calling Agent Token"
                      value={newTokenName}
                      onChange={(e) => setNewTokenName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Expires In (days)</label>
                    <Input
                      type="number"
                      placeholder="Leave empty for no expiration"
                      value={newTokenExpiry}
                      onChange={(e) => setNewTokenExpiry(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={createToken}
                      disabled={!newTokenName}
                      className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600"
                    >
                      Generate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4 text-green-600">Token Created!</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800 mb-2">
                    ⚠️ Copy this token now. You won't be able to see it again!
                  </p>
                  <div className="bg-white p-3 rounded border border-yellow-300 font-mono text-sm break-all">
                    {createdToken}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      copyToClipboard(createdToken, 'new');
                    }}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Token
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCreatedToken(null);
                      setShowCreateModal(false);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tokens.map((token, index) => (
          <motion.div
            key={token.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="h-full"
          >
            <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg">
                      <Key className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{token.name}</h3>
                      <p className="text-sm text-gray-600">
                        by {token.admin.firstName} {token.admin.lastName}
                      </p>
                    </div>
                  </div>
                  <Badge variant={token.isActive ? 'default' : 'destructive'}>
                    {token.isActive ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" /> Revoked</>
                    )}
                  </Badge>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono text-gray-600">
                      {token.token.substring(0, 20)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(token.token, token.id)}
                    >
                      {copiedId === token.id ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
                  <div>
                    <div className="text-xs text-gray-600">Created</div>
                    <div className="text-sm font-medium">
                      {new Date(token.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Last Used</div>
                    <div className="text-sm font-medium">
                      {token.lastUsedAt 
                        ? new Date(token.lastUsedAt).toLocaleDateString()
                        : 'Never'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Total Calls</div>
                    <div className="text-sm font-medium flex items-center">
                      <Activity className="h-3 w-3 mr-1 text-teal-600" />
                      {token._count.apiLogs}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Expires</div>
                    <div className="text-sm font-medium">
                      {token.expiresAt 
                        ? new Date(token.expiresAt).toLocaleDateString()
                        : 'Never'}
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  {token.isActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeToken(token.id)}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Revoke Token
                    </Button>
                  ) : (
                    <div className="w-full h-9 flex items-center justify-center text-sm text-gray-500">
                      Token Revoked
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {tokens.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No API Tokens Yet</h3>
            <p className="text-gray-600 mb-4">
              Generate your first API token to enable external system access
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-teal-600 to-emerald-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate Token
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
