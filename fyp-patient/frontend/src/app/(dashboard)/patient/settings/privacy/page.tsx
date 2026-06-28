"use client";

import { useEffect, useState } from "react";
import api from "@/services/api.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, ShieldCheck, Brain, Stethoscope, MessageSquare, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface PrivacySettings {
  shareDataWithAI: boolean;
  allowDoctorChatAccess: boolean;
}

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState<PrivacySettings>({
    shareDataWithAI: true,
    allowDoctorChatAccess: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingChats, setDeletingChats] = useState(false);
  const [confirmDeleteChats, setConfirmDeleteChats] = useState(false);

  useEffect(() => {
    api.get("/profile/privacy")
      .then((r) => setSettings(r.data))
      .catch(() => toast.error("Failed to load privacy settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await api.put("/profile/privacy", settings);
      toast.success("Privacy settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteChats() {
    if (!confirmDeleteChats) {
      setConfirmDeleteChats(true);
      return;
    }
    setDeletingChats(true);
    try {
      await api.delete("/profile/chat-sessions");
      toast.success("All chat sessions deleted");
      setConfirmDeleteChats(false);
    } catch {
      toast.error("Failed to delete chat sessions");
    } finally {
      setDeletingChats(false);
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
    <div className="flex flex-col gap-6 pb-8 max-w-xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Privacy Settings</h1>
        <p className="text-muted-foreground mt-1">Control how your health data is shared within DocLink</p>
      </div>

      {/* Data sharing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle>Data Sharing Preferences</CardTitle>
          </div>
          <CardDescription>
            These settings control what personal health information is shared with AI and doctors.
            Changes take effect on your next interaction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* AI toggle */}
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 p-4">
            <div className="flex gap-3">
              <Brain className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Share health data with AI Assistant</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  When enabled, your medical history and allergies are included in AI chat
                  conversations to improve recommendations. When disabled, only your name and
                  city are shared.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.shareDataWithAI}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, shareDataWithAI: v }))}
            />
          </div>

          {/* Doctor chat access toggle */}
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 p-4">
            <div className="flex gap-3">
              <Stethoscope className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Allow doctors to view my chat history & AI predictions</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  When enabled, doctors you have appointments with can see your AI chat sessions
                  and disease predictions. Disabling this hides them from the doctor portal.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.allowDoctorChatAccess}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, allowDoctorChatAccess: v }))}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Data deletion */}
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-destructive" />
            <CardTitle>Chat Data</CardTitle>
          </div>
          <CardDescription>
            Permanently delete your AI chat history. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {confirmDeleteChats && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>This will permanently delete all your chat sessions and AI predictions. Are you sure?</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="destructive"
              disabled={deletingChats}
              onClick={handleDeleteChats}
              className="flex items-center gap-2"
            >
              {deletingChats
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Trash2 className="h-4 w-4" />}
              {confirmDeleteChats ? "Confirm Delete All Chats" : "Delete All Chat Sessions"}
            </Button>
            {confirmDeleteChats && (
              <Button variant="outline" onClick={() => setConfirmDeleteChats(false)}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info box */}
      <p className="text-xs text-muted-foreground px-1">
        Your data is stored securely and never sold to third parties. For full details see our{" "}
        <a href="/privacy" className="text-primary underline" target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </a>.
        To request full account deletion, contact support.
      </p>
    </div>
  );
}
