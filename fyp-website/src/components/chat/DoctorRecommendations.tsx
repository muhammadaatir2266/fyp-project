"use client";

import { MapPin, Star, Clock, DollarSign, ExternalLink, UserPlus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buildGuestAuthHref } from "@/lib/guest-session";
import type {
  DoctorRecommendations as DoctorRecommendationsType,
  InternalDoctorItem,
  GoogleDoctorItem,
} from "@/lib/guest-chat";

interface Props {
  recommendations: DoctorRecommendationsType;
}

function InternalCard({ doc }: { doc: InternalDoctorItem }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{doc.name}</p>
          <p className="text-xs text-muted-foreground">{doc.specialty}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-amber-500">
          <Star className="h-3 w-3 fill-current" />
          <span className="text-xs font-medium">{doc.rating > 0 ? doc.rating.toFixed(1) : "New"}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {doc.city && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" /> {doc.city}
          </span>
        )}
        {doc.experience > 0 && (
          <span className="text-[11px] text-muted-foreground">{doc.experience} yrs exp</span>
        )}
        {doc.consultationFee > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <DollarSign className="h-3 w-3" /> Rs {doc.consultationFee}
          </span>
        )}
        {doc.workingHours && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> {doc.workingHours.from}–{doc.workingHours.to}
          </span>
        )}
      </div>

      <Link
        href={buildGuestAuthHref("/signup/patient")}
        className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <UserPlus className="h-3 w-3" />
        Sign up to book
      </Link>
    </div>
  );
}

function GoogleCard({ doc }: { doc: GoogleDoctorItem }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground leading-snug">{doc.name}</p>
        <div className="flex items-center gap-1 shrink-0 text-amber-500">
          <Star className="h-3 w-3 fill-current" />
          <span className="text-xs font-medium">{doc.rating > 0 ? doc.rating.toFixed(1) : "—"}</span>
          {doc.totalReviews != null && (
            <span className="text-[10px] text-muted-foreground">({doc.totalReviews})</span>
          )}
        </div>
      </div>

      {doc.address && (
        <p className="text-[11px] text-muted-foreground line-clamp-2">{doc.address}</p>
      )}

      {doc.googleMapsUrl && (
        <a
          href={doc.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          View on Google Maps
        </a>
      )}
    </div>
  );
}

export function DoctorRecommendations({ recommendations }: Props) {
  const { source, doctors } = recommendations;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-primary">Recommended Doctors</p>
        <span
          className={cn(
            "text-[10px] font-medium px-2 py-0.5 rounded-full",
            source === "internal_db"
              ? "bg-primary/10 text-primary"
              : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
          )}
        >
          {source === "internal_db" ? "DocLink" : "Google Maps"}
        </span>
      </div>

      <div className="space-y-2">
        {doctors.map((doc, i) =>
          doc.source === "internal_db" ? (
            <InternalCard key={i} doc={doc} />
          ) : (
            <GoogleCard key={i} doc={doc} />
          )
        )}
      </div>

      <p className="text-[10px] text-muted-foreground italic">
        {source === "internal_db"
          ? "Verified DocLink doctors. Create an account to book."
          : "External results from Google Maps. Not affiliated with DocLink."}
      </p>
    </div>
  );
}
