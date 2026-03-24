"use client";

import { useEffect, useState } from "react";
import { Phone, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { formatDate, formatTime, formatDuration } from "@/lib/utils";
import type { CallLog } from "@/types";

export default function CallLogsPage() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  useEffect(() => {
    fetchCalls();
  }, []);

  useEffect(() => {
    filterCalls();
  }, [searchQuery, calls]);

  const fetchCalls = async () => {
    try {
      const response = await api.get("/doctor/calls");
      setCalls(response.data);
      setFilteredCalls(response.data);
    } catch (error) {
      console.error("Failed to fetch calls:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCalls = () => {
    if (!searchQuery) {
      setFilteredCalls(calls);
      return;
    }

    const filtered = calls.filter((call) => {
      const searchText = `${call.callerName} ${call.callerPhone}`.toLowerCase();
      return searchText.includes(searchQuery.toLowerCase());
    });

    setFilteredCalls(filtered);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "success" | "destructive"> = {
      COMPLETED: "success",
      FAILED: "destructive",
      ACTIVE: "default",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-6" />
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Call Logs</h1>
        <p className="text-muted-foreground">
          View call history from the smart calling agent
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
          <CardDescription>
            All calls received through the AI calling system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by caller name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredCalls.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-12"
            >
              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No call logs found</p>
            </motion.div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caller</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.map((call, index) => (
                    <motion.tr
                      key={call.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        {call.callerName || "Unknown"}
                      </TableCell>
                      <TableCell>{call.callerPhone}</TableCell>
                      <TableCell>{formatDate(call.startedAt)}</TableCell>
                      <TableCell>{formatTime(call.startedAt)}</TableCell>
                      <TableCell>
                        {call.duration ? formatDuration(call.duration) : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{call.callType}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(call.status)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCall(call)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {selectedCall && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
          <CardHeader>
            <CardTitle>Call Details</CardTitle>
            <CardDescription>
              {formatDate(selectedCall.startedAt)} at{" "}
              {formatTime(selectedCall.startedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCall.summary && (
              <div>
                <h4 className="text-sm font-medium mb-2">AI Summary</h4>
                <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted">
                  {selectedCall.summary}
                </p>
              </div>
            )}

            {selectedCall.transcript && (
              <div>
                <h4 className="text-sm font-medium mb-2">Transcript</h4>
                <div className="text-sm text-muted-foreground p-3 rounded-lg bg-muted max-h-96 overflow-y-auto whitespace-pre-wrap">
                  {selectedCall.transcript}
                </div>
              </div>
            )}

            <Button variant="outline" onClick={() => setSelectedCall(null)}>
              Close
            </Button>
          </CardContent>
        </Card>
        </motion.div>
      )}
    </div>
  );
}
