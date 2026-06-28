"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Save,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Info,
  Link2,
  Unlink,
  CalendarClock,
  RotateCcw,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

const DAYS_OF_WEEK = [
  { name: "Monday", short: "Mon" },
  { name: "Tuesday", short: "Tue" },
  { name: "Wednesday", short: "Wed" },
  { name: "Thursday", short: "Thu" },
  { name: "Friday", short: "Fri" },
  { name: "Saturday", short: "Sat" },
  { name: "Sunday", short: "Sun" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const SLOT_MINUTES = 30;

// Local civil date key "YYYY-MM-DD" (avoids UTC day-shift from toISOString()).
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function slotStartAt(dateStr: string, slot: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = slot.split(":").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setHours(h, min, 0, 0);
  return dt;
}

function earliestBookableAt(minAdvanceSlots: number, now = new Date()): Date {
  const slots = Math.max(0, minAdvanceSlots);
  const earliest = new Date(now.getTime() + slots * SLOT_MINUTES * 60_000);
  const minutes = earliest.getMinutes();
  const remainder = minutes % SLOT_MINUTES;
  if (remainder !== 0 || earliest.getSeconds() > 0 || earliest.getMilliseconds() > 0) {
    earliest.setMinutes(minutes + (SLOT_MINUTES - remainder), 0, 0);
  } else {
    earliest.setSeconds(0, 0);
  }
  return earliest;
}

function isSlotTooSoon(dateStr: string, slot: string, minAdvanceSlots: number, now = new Date()): boolean {
  const todayKey = dateKey(now);
  if (dateStr < todayKey) return true;
  if (dateStr > todayKey) return false;
  return slotStartAt(dateStr, slot) < earliestBookableAt(minAdvanceSlots, now);
}

// Full-day 30-minute grid of slot labels ("00:00" … "23:30").
const ALL_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    slots.push(`${pad(h)}:00`, `${pad(h)}:30`);
  }
  return slots;
})();

const parseKey = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};

type SlotOverrides = Record<string, string[]>;

export default function AvailabilityPage() {
  const [availableFrom, setAvailableFrom] = useState("09:00");
  const [availableTo, setAvailableTo] = useState("17:00");
  const [minAdvanceSlots, setMinAdvanceSlots] = useState(2);
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [slotOverrides, setSlotOverrides] = useState<SlotOverrides>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [googleStatus, setGoogleStatus] = useState<{
    configured: boolean;
    connected: boolean;
    email: string | null;
  } | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    fetchAvailability();
    fetchGoogleStatus();

    // Handle the OAuth callback redirect (?google=connected|error)
    const params = new URLSearchParams(window.location.search);
    const googleParam = params.get("google");
    if (googleParam) {
      if (googleParam === "connected") {
        setMessage("Google Calendar connected successfully!");
      } else {
        setMessage("Failed to connect Google Calendar. Please try again.");
      }
      setTimeout(() => setMessage(""), 4000);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const fetchGoogleStatus = async () => {
    try {
      const response = await api.get("/doctor/google/status");
      setGoogleStatus(response.data);
    } catch (error) {
      console.error("Failed to fetch Google status:", error);
      setGoogleStatus({ configured: false, connected: false, email: null });
    }
  };

  const handleConnectGoogle = async () => {
    setGoogleBusy(true);
    try {
      const response = await api.get("/doctor/google/connect");
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Failed to start Google connection:", error);
      setMessage("Failed to start Google connection.");
      setTimeout(() => setMessage(""), 3000);
      setGoogleBusy(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setGoogleBusy(true);
    try {
      await api.post("/doctor/google/disconnect");
      await fetchGoogleStatus();
      setMessage("Google Calendar disconnected successfully.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to disconnect Google Calendar:", error);
      setMessage("Failed to disconnect Google Calendar.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setGoogleBusy(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await api.get("/doctor/availability");
      const data = response.data;
      setAvailableFrom(data.availableFrom || "09:00");
      setAvailableTo(data.availableTo || "17:00");
      setMinAdvanceSlots(typeof data.minAdvanceSlots === "number" ? data.minAdvanceSlots : 2);
      setWorkingDays(data.workingDays || []);

      // slotOverrides is stored as JSON: { "YYYY-MM-DD": ["HH:MM", ...] }
      if (data.slotOverrides && typeof data.slotOverrides === "object") {
        const cleaned: SlotOverrides = {};
        for (const [key, value] of Object.entries(data.slotOverrides)) {
          if (Array.isArray(value)) {
            cleaned[key] = (value as unknown[]).filter((v): v is string => typeof v === "string");
          }
        }
        setSlotOverrides(cleaned);
      }
    } catch (error) {
      console.error("Failed to fetch availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      await api.put("/doctor/availability", {
        availableFrom,
        availableTo,
        workingDays,
        slotOverrides,
        minAdvanceSlots,
      });
      setMessage("Availability updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to update availability");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Default slots for a date derived from the weekly working hours/days.
  const defaultSlotsForDate = (date: Date): string[] => {
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    if (!workingDays.includes(weekday)) return [];
    return hoursSlots();
  };

  // 30-minute slots between the configured working hours (weekday-agnostic).
  const hoursSlots = (): string[] => {
    const fromH = parseInt(availableFrom.split(":")[0]);
    const toH = parseInt(availableTo.split(":")[0]);
    const out: string[] = [];
    for (let h = fromH; h < toH; h++) {
      out.push(`${pad(h)}:00`, `${pad(h)}:30`);
    }
    return out;
  };

  const editingKey = selectedDate ? dateKey(selectedDate) : null;
  const isCustomized = editingKey ? editingKey in slotOverrides : false;
  const editingSlots: string[] = editingKey
    ? slotOverrides[editingKey] ?? defaultSlotsForDate(selectedDate as Date)
    : [];
  const editingSet = new Set(editingSlots);

  const toggleSlot = (slot: string) => {
    if (!editingKey || !selectedDate) return;
    if (isSlotTooSoon(editingKey, slot, minAdvanceSlots)) return;
    setSlotOverrides((prev) => {
      const base = prev[editingKey] ?? defaultSlotsForDate(selectedDate);
      const set = new Set(base);
      if (set.has(slot)) set.delete(slot);
      else set.add(slot);
      return { ...prev, [editingKey]: Array.from(set).sort() };
    });
  };

  const setDateSlots = (slots: string[]) => {
    if (!editingKey) return;
    setSlotOverrides((prev) => ({ ...prev, [editingKey]: [...slots].sort() }));
  };

  const resetDateToDefault = (key: string) => {
    setSlotOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const customizedKeys = Object.keys(slotOverrides).sort();
  const highlightDates = [
    ...customizedKeys.map(parseKey),
    ...(selectedDate ? [selectedDate] : []),
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
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
        <h1 className="text-3xl font-bold tracking-tight">Availability Management</h1>
        <p className="text-muted-foreground mt-1">
          Set your weekly working hours, then fine-tune individual time slots for specific dates
        </p>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className={`border-2 ${
                message.includes("success")
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-destructive/50 bg-destructive/5"
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {message.includes("success") ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <p
                    className={`font-medium ${
                      message.includes("success") ? "text-green-600" : "text-destructive"
                    }`}
                  >
                    {message}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Working Hours Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="h-full hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Default Working Hours</CardTitle>
              </div>
              <CardDescription>Your standard daily consultation hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="from" className="text-sm font-medium flex items-center gap-2">
                    Start Time
                    <Badge variant="outline" className="text-xs">From</Badge>
                  </label>
                  <Input
                    id="from"
                    type="time"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="text-lg font-medium h-12 pl-4 pr-4 hover:border-primary/50 focus:border-primary transition-colors"
                  />
                </div>

                <div className="flex items-center justify-center">
                  <div className="h-px w-full bg-border" />
                  <span className="px-4 text-xs text-muted-foreground whitespace-nowrap">to</span>
                  <div className="h-px w-full bg-border" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="to" className="text-sm font-medium flex items-center gap-2">
                    End Time
                    <Badge variant="outline" className="text-xs">To</Badge>
                  </label>
                  <Input
                    id="to"
                    type="time"
                    value={availableTo}
                    onChange={(e) => setAvailableTo(e.target.value)}
                    className="text-lg font-medium h-12 pl-4 pr-4 hover:border-primary/50 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="space-y-2">
                  <label htmlFor="minAdvance" className="text-sm font-medium flex items-center gap-2">
                    Same-day booking buffer
                    <Badge variant="outline" className="text-xs">Slots</Badge>
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="minAdvance"
                      type="number"
                      min={0}
                      max={12}
                      value={minAdvanceSlots}
                      onChange={(e) =>
                        setMinAdvanceSlots(Math.max(0, Math.min(12, parseInt(e.target.value) || 0)))
                      }
                      className="w-24 h-11 text-center font-medium"
                    />
                    <p className="text-xs text-muted-foreground">
                      Patients can book today starting{" "}
                      <span className="font-medium text-foreground">
                        {minAdvanceSlots * 30} min
                      </span>{" "}
                      from now ({minAdvanceSlots} × 30-min slot{minAdvanceSlots !== 1 ? "s" : ""}).
                      Past slots are always hidden.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-600">
                    Default hours apply to every working day unless you customize a specific date below.
                    Same-day bookings respect the buffer above; past time slots are never bookable.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Working Days Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="h-full hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Working Days</CardTitle>
              </div>
              <CardDescription>The days you&apos;re available by default each week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isAvailable = workingDays.includes(day.name);
                  return (
                    <button
                      key={day.name}
                      type="button"
                      onClick={() => toggleDay(day.name)}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 ${
                        isAvailable
                          ? "border-primary/50 bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-xs ${
                            isAvailable
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {day.short}
                        </div>
                        <span className="font-medium text-sm">{day.name}</span>
                      </div>
                      {isAvailable ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {workingDays.length} day{workingDays.length !== 1 ? "s" : ""}
                  </span>{" "}
                  selected for consultations
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Date-specific Slots Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarClock className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Date-specific Slots</CardTitle>
            </div>
            <CardDescription>
              Pick a date, then turn individual time slots on or off. A customized date overrides your
              default hours for that day only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
              {/* Calendar + customized list */}
              <div className="space-y-4">
                <div className="border rounded-lg bg-muted/20 max-w-sm mx-auto w-full">
                  <Calendar selectedDates={highlightDates} onDateSelect={(d) => setSelectedDate(d)} />
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Badge variant="secondary" className="h-5">
                      {customizedKeys.length}
                    </Badge>
                    Customized Dates
                  </h4>
                  {customizedKeys.length === 0 ? (
                    <div className="p-5 text-center border-2 border-dashed rounded-lg">
                      <CalendarClock className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No customized dates yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pick a date on the calendar to edit its slots
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      <AnimatePresence>
                        {customizedKeys.map((key) => {
                          const date = parseKey(key);
                          const count = slotOverrides[key].length;
                          return (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.2 }}
                              className={`flex items-center justify-between p-2.5 rounded-lg border bg-card transition-all group cursor-pointer ${
                                editingKey === key ? "border-primary/60 ring-1 ring-primary/30" : "hover:border-primary/40"
                              }`}
                              onClick={() => setSelectedDate(date)}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                    count === 0 ? "bg-destructive/10" : "bg-primary/10"
                                  }`}
                                >
                                  <span
                                    className={`text-base font-bold ${
                                      count === 0 ? "text-destructive" : "text-primary"
                                    }`}
                                  >
                                    {date.getDate()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{formatDate(date)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {count === 0 ? "Day off" : `${count} slot${count !== 1 ? "s" : ""}`}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Reset to default hours"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  resetDateToDefault(key);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              {/* Slot editor */}
              <div className="border rounded-xl p-4 bg-muted/10">
                {!selectedDate ? (
                  <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center">
                    <CalendarClock className="h-10 w-10 text-muted-foreground/60 mb-3" />
                    <p className="text-sm font-medium">Select a date to edit its slots</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Click any date on the calendar. Slots default to your working hours and can be
                      toggled individually.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {selectedDate.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isCustomized ? (
                            <span className="text-primary font-medium">
                              Customized · {editingSlots.length} slot{editingSlots.length !== 1 ? "s" : ""} available
                            </span>
                          ) : (
                            "Following default working hours"
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setDateSlots(hoursSlots())}>
                          <Sun className="h-3.5 w-3.5 mr-1.5" />
                          Working hours
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDateSlots([])}>
                          <Moon className="h-3.5 w-3.5 mr-1.5" />
                          Day off
                        </Button>
                        {isCustomized && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => editingKey && resetDateToDefault(editingKey)}
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                      {ALL_SLOTS.map((slot) => {
                        const active = editingSet.has(slot);
                        const locked = editingKey ? isSlotTooSoon(editingKey, slot, minAdvanceSlots) : false;
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={locked}
                            onClick={() => toggleSlot(slot)}
                            title={
                              locked
                                ? "Past or inside same-day booking buffer — not bookable by patients"
                                : undefined
                            }
                            className={`px-1 py-1.5 rounded-md text-xs font-medium border transition-all ${
                              locked
                                ? "bg-muted/60 text-muted-foreground/50 border-transparent cursor-not-allowed line-through"
                                : active
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90"
                                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>

                    {editingKey === dateKey(new Date()) && (
                      <p className="text-xs text-muted-foreground">
                        Crossed-out slots are in the past or inside your {minAdvanceSlots}-slot same-day
                        buffer and won&apos;t appear to patients.
                      </p>
                    )}

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-600">
                        Highlighted slots are bookable by patients. Turn all slots off to mark the whole
                        day as unavailable. Remember to save your changes.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Google Calendar Section */}
      {googleStatus?.configured && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Google Calendar</CardTitle>
              </div>
              <CardDescription>
                Your Google busy times block bookings, and new appointments are added to your calendar automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      googleStatus.connected ? "bg-green-500/10" : "bg-muted"
                    }`}
                  >
                    {googleStatus.connected ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Link2 className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {googleStatus.connected ? "Connected" : "Not connected"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {googleStatus.connected
                        ? googleStatus.email ?? "Google Calendar linked"
                        : "Connect to sync your external busy times"}
                    </p>
                  </div>
                </div>

                {googleStatus.connected ? (
                  <Button
                    variant="outline"
                    onClick={handleDisconnectGoogle}
                    disabled={googleBusy}
                    className="min-w-[160px]"
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    onClick={handleConnectGoogle}
                    disabled={googleBusy}
                    className="min-w-[160px] shadow-md"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Connect Google Calendar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-semibold">Ready to update your availability?</p>
                <p className="text-sm text-muted-foreground">
                  Your changes will be reflected immediately for new appointments
                </p>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                size="lg"
                className="min-w-[160px] shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {saving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-5 w-5 border-2 border-current border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
