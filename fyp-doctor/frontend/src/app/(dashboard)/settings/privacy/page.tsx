"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ShieldCheck,
  Bell,
  FileText,
  Loader2,
  Info,
} from "lucide-react";

export default function DoctorPrivacyPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get("/doctor/settings/notifications")
      .then((r) => {
        if (r.data.emailNotifications !== undefined)
          setEmailNotifications(r.data.emailNotifications);
        if (r.data.smsNotifications !== undefined)
          setSmsNotifications(r.data.smsNotifications);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await api.put("/doctor/settings/notifications", {
        emailNotifications,
        smsNotifications,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Privacy & Notifications</h1>
        <p className="text-muted-foreground mt-1">
          Control how DocLink contacts you and what data is shared
        </p>
      </motion.div>

      {/* Notification preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose how you receive appointment and system notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 p-4">
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Appointment reminders, booking confirmations, and account alerts
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 p-4">
              <div>
                <p className="text-sm font-medium">SMS Notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Urgent appointment alerts sent to your registered phone number
                </p>
              </div>
              <Switch
                checked={smsNotifications}
                onCheckedChange={setSmsNotifications}
              />
            </div>

            {saved && (
              <p className="text-sm text-green-600 font-medium">
                Preferences saved successfully.
              </p>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Patient data access info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Patient Data Access
            </CardTitle>
            <CardDescription>
              How DocLink controls access to patient information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3 items-start rounded-xl border border-border/60 p-4">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p>
                You can only view a patient&apos;s profile, symptoms, and chat history
                if you have a shared appointment with them. Access is automatically
                revoked when appointments are cancelled or completed.
              </p>
            </div>
            <div className="flex gap-3 items-start rounded-xl border border-border/60 p-4">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p>
                Patients control whether their AI chat history and health predictions
                are visible to doctors. If a patient opts out, that data will not be
                shown in the patient record view.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Call transcript info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Call & Data Retention
            </CardTitle>
            <CardDescription>
              Information about how call data is stored
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3 items-start rounded-xl border border-border/60 p-4">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p>
                Voice call transcripts are stored in DocLink to help you review
                AI-assisted booking sessions. Call booking intents are automatically
                purged after 30 minutes. Full transcripts are retained until you
                contact support to request deletion.
              </p>
            </div>
            <div className="flex gap-3 items-start rounded-xl border border-border/60 p-4">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p>
                Your Google Calendar connection is encrypted at rest. You can
                disconnect Google Calendar at any time from the{" "}
                <a href="/availability" className="text-primary underline">
                  Availability
                </a>{" "}
                page, which immediately revokes access.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
