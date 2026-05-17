"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, MapPin, ArrowRight, Clock } from "lucide-react";

interface Complaint {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: "pending" | "in-progress" | "completed" | "rejected";
  location: { address?: string };
  images: string[];
  votes: number;
  createdAt: string;
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  pending: {
    label: "Pending",
    bg: "bg-amber-500/15",
    text: "text-amber-500",
    dot: "bg-amber-500",
  },
  "in-progress": {
    label: "In Progress",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-500/15",
    text: "text-emerald-500",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-500/15",
    text: "text-red-400",
    dot: "bg-red-400",
  },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${m}m ago`;
}

export default function FeaturedComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchComplaints() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/complaints?public=true&limit=3");
        if (!response.ok) throw new Error("Failed to fetch complaints");
        const data = await response.json();
        setComplaints(data.complaints);
      } catch {
        setError("Unable to load complaints. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchComplaints();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]"
          >
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="p-5 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-12 w-full" />
              <div className="flex justify-between pt-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400 text-sm">{error}</div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="text-center text-[var(--text-muted)] py-12 text-sm">
        No complaints yet. Be the first to report an issue in your community!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {complaints.map((complaint, i) => {
        const status = statusConfig[complaint.status] ?? statusConfig.pending;
        return (
          <motion.div
            key={complaint._id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: i * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ y: -6 }}
            className="group rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-shadow"
          >
            {/* Image */}
            <div className="h-48 relative bg-[var(--surface-3)] overflow-hidden">
              {complaint.images?.length > 0 ? (
                <Image
                  src={complaint.images[0]}
                  alt={complaint.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                  <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] flex items-center justify-center">
                    <MapPin className="w-6 h-6 opacity-40" />
                  </div>
                  <span className="text-xs opacity-60">No image</span>
                </div>
              )}
              {/* Category badge overlay */}
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/50 backdrop-blur-sm text-white border border-white/10">
                  {complaint.category}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
              {/* Status + time */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
                <span className="flex items-center gap-1 text-[var(--text-muted)] text-xs">
                  <Clock className="w-3 h-3" />
                  {timeAgo(complaint.createdAt)}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                {complaint.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                {complaint.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
                <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{complaint.votes} votes</span>
                </div>
                <Link
                  href={`/dashboard/complaints/${complaint._id}`}
                  className="group/link inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                >
                  View Details
                  <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
