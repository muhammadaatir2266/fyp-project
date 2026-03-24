"use client";

import { useEffect, useState } from "react";
import { Clock, Save, Calendar as CalendarIcon, CheckCircle2, XCircle, Info } from "lucide-react";
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

export default function AvailabilityPage() {
  const [availableFrom, setAvailableFrom] = useState("09:00");
  const [availableTo, setAvailableTo] = useState("17:00");
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await api.get("/doctor/availability");
      const data = response.data;
      setAvailableFrom(data.availableFrom || "09:00");
      setAvailableTo(data.availableTo || "17:00");
      setWorkingDays(data.workingDays || []);
      
      // Parse unavailable dates if they exist
      if (data.unavailableDates) {
        setUnavailableDates(data.unavailableDates.map((d: string) => new Date(d)));
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
        unavailableDates: unavailableDates.map(d => d.toISOString()),
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

  const handleDateSelect = (date: Date) => {
    setUnavailableDates((prev) => {
      const exists = prev.some(
        (d) =>
          d.getDate() === date.getDate() &&
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
      );

      if (exists) {
        return prev.filter(
          (d) =>
            !(
              d.getDate() === date.getDate() &&
              d.getMonth() === date.getMonth() &&
              d.getFullYear() === date.getFullYear()
            )
        );
      } else {
        return [...prev, date];
      }
    });
  };

  const removeUnavailableDate = (date: Date) => {
    setUnavailableDates((prev) =>
      prev.filter(
        (d) =>
          !(
            d.getDate() === date.getDate() &&
            d.getMonth() === date.getMonth() &&
            d.getFullYear() === date.getFullYear()
          )
      )
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
          Configure your working hours, available days, and block specific dates
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
                      message.includes("success")
                        ? "text-green-600"
                        : "text-destructive"
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
                <CardTitle>Working Hours</CardTitle>
              </div>
              <CardDescription>
                Set your daily consultation hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="from" className="text-sm font-medium flex items-center gap-2">
                    Start Time
                    <Badge variant="outline" className="text-xs">From</Badge>
                  </label>
                  <div className="relative">
                    <Input
                      id="from"
                      type="time"
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                      className="text-lg font-medium h-12 pl-4 pr-4 hover:border-primary/50 focus:border-primary transition-colors"
                    />
                  </div>
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
                  <div className="relative">
                    <Input
                      id="to"
                      type="time"
                      value={availableTo}
                      onChange={(e) => setAvailableTo(e.target.value)}
                      className="text-lg font-medium h-12 pl-4 pr-4 hover:border-primary/50 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-600">
                    These hours will apply to all your selected working days
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
              <CardDescription>
                Select the days you're available for consultations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day, index) => {
                  const isAvailable = workingDays.includes(day.name);
                  return (
                    <motion.div
                      key={day.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="group"
                    >
                      <div
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                          isAvailable
                            ? "border-primary/50 bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/30 hover:bg-muted/50"
                        }`}
                        onClick={() => toggleDay(day.name)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                              isAvailable
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "bg-muted text-muted-foreground group-hover:bg-primary/10"
                            }`}
                          >
                            {day.short}
                          </div>
                          <span className="font-medium">{day.name}</span>
                        </div>
                        <motion.div
                          initial={false}
                          animate={{
                            scale: isAvailable ? 1 : 0.9,
                            opacity: isAvailable ? 1 : 0.5,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <Button
                            size="sm"
                            variant={isAvailable ? "default" : "outline"}
                            className={`min-w-[100px] transition-all duration-300 ${
                              isAvailable
                                ? "shadow-md"
                                : "hover:border-primary/50"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDay(day.name);
                            }}
                          >
                            {isAvailable ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Available
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                Unavailable
                              </span>
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
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

      {/* Calendar Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Block Specific Dates</CardTitle>
            </div>
            <CardDescription>
              Mark dates when you'll be unavailable (holidays, vacations, special days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="border rounded-lg bg-muted/20 max-w-md mx-auto w-full">
                <Calendar
                  selectedDates={unavailableDates}
                  onDateSelect={handleDateSelect}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Badge variant="destructive" className="h-5">
                      {unavailableDates.length}
                    </Badge>
                    Blocked Dates
                  </h4>
                  {unavailableDates.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed rounded-lg">
                      <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No dates blocked yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click on calendar dates to block them
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
                      <AnimatePresence>
                        {unavailableDates
                          .sort((a, b) => a.getTime() - b.getTime())
                          .map((date, index) => (
                            <motion.div
                              key={date.toISOString()}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.2, delay: index * 0.03 }}
                              whileHover={{ scale: 1.02 }}
                              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/50 transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                                  <span className="text-lg font-bold text-destructive">
                                    {date.getDate()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {formatDate(date)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {date.toLocaleDateString("en-US", {
                                      weekday: "long",
                                    })}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeUnavailableDate(date)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
