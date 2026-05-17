"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import MainLayout from "@/components/MainLayout";
import FeaturedComplaints from "@/components/FeaturedComplaints";
import MapPreview from "@/components/MapPreview";
import {
  Camera,
  ThumbsUp,
  CheckCircle2,
  MapPin,
  ImageIcon,
  BarChart3,
  Bell,
  ArrowRight,
  Sparkles,
  Shield,
  Users,
} from "lucide-react";

/* ── Animation helpers ───────────────────────────────── */

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Data ────────────────────────────────────────────── */

const steps = [
  {
    icon: Camera,
    title: "Report an Issue",
    desc: "Take a photo, choose a category, and describe the problem in your community.",
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/30",
  },
  {
    icon: ThumbsUp,
    title: "Vote on Issues",
    desc: "Support issues that matter to you. Higher-voted complaints get prioritized.",
    gradient: "from-cyan-500 to-blue-600",
    glow: "shadow-cyan-500/30",
  },
  {
    icon: CheckCircle2,
    title: "Track Resolution",
    desc: "Follow every step from submission to resolution with real-time updates.",
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/30",
  },
];

const features = [
  {
    icon: MapPin,
    title: "Location-Based Reporting",
    desc: "Automatically pin issues on the map with Google Maps integration for precise reporting.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: ImageIcon,
    title: "Image Uploads",
    desc: "Upload photos as evidence to help authorities understand issues at a glance.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: BarChart3,
    title: "Voting System",
    desc: "Democratic prioritization — the community decides what gets fixed first.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Bell,
    title: "Real-time Updates",
    desc: "Receive instant notifications as your complaint moves from pending to resolved.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "Enterprise-grade Clerk authentication ensures your data is always protected.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: Users,
    title: "Community Driven",
    desc: "Built for citizens, by citizens — a platform that amplifies every voice.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
];

const stats = [
  { label: "Issues Reported", value: "2,400+", color: "text-violet-400" },
  { label: "Resolved", value: "1,800+", color: "text-emerald-400" },
  { label: "Active Users", value: "5,200+", color: "text-cyan-400" },
  { label: "Cities", value: "14+", color: "text-amber-400" },
];

/* ── Component ───────────────────────────────────────── */

export default function Home() {
  return (
    <MainLayout>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#080612] -mt-16 pt-16">
        {/* Animated gradient bg */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 animate-gradient"
            style={{
              background:
                "linear-gradient(135deg, #0d0a1e 0%, #1a0a3e 25%, #0d1f3e 50%, #0a1a30 75%, #130a2e 100%)",
              backgroundSize: "400% 400%",
            }}
          />
          {/* Glowing orbs */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-600/20 blur-[100px]"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[140px]"
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <div className="space-y-8">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-violet-500/15 border border-violet-500/30 text-violet-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  Civic Engagement Platform
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight"
              >
                <span className="text-white">Your Voice,</span>
                <br />
                <span className="gradient-text-hero">Your City</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-lg text-white/60 max-w-lg leading-relaxed"
              >
                CivicSync connects citizens with local authorities to surface,
                prioritize, and resolve community issues — transparently.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link
                  href="/dashboard/new-complaint"
                  className="group relative inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white overflow-hidden shadow-lg shadow-violet-600/30 transition-all hover:shadow-violet-600/50 hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                  }}
                >
                  <span>Report an Issue</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/map"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white/80 hover:text-white border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  View Map
                </Link>
              </motion.div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-wrap gap-6 pt-4"
              >
                {stats.map(({ label, value, color }) => (
                  <div key={label}>
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-white/40 mt-0.5">{label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Floating UI card */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Main card */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="glass rounded-2xl p-6 space-y-4 border border-white/20 shadow-2xl shadow-violet-900/30"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">Street Light Outage</div>
                      <div className="text-white/40 text-xs">Main St &amp; 5th Ave</div>
                    </div>
                    <span className="ml-auto px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Pending
                    </span>
                  </div>
                  <div className="h-36 rounded-xl bg-gradient-to-br from-violet-900/40 to-blue-900/40 border border-white/10 flex items-center justify-center">
                    <div className="text-white/20 text-sm">📍 Location Map</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/50 text-xs">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>24 votes</span>
                    </div>
                    <div className="flex -space-x-2">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full border-2 border-[#080612]"
                          style={{
                            background: `hsl(${260 + i * 30}, 70%, 60%)`,
                          }}
                        />
                      ))}
                      <div className="w-7 h-7 rounded-full border-2 border-[#080612] bg-white/10 flex items-center justify-center text-white/50 text-[10px]">
                        +12
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating notification card */}
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-8 -left-10 glass rounded-xl px-4 py-3 flex items-center gap-3 border border-white/15 shadow-xl"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-white text-xs font-medium">Issue Resolved!</div>
                    <div className="text-white/40 text-[10px]">2 minutes ago</div>
                  </div>
                </motion.div>

                {/* Glow dot */}
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-violet-500/30 blur-2xl" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent" />
      </section>

      {/* ── Featured Issues ────────────────────────────────── */}
      <section className="py-24 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 mb-4">
              <Sparkles className="w-3 h-3" />
              Live Community Issues
            </span>
            <h2 className="text-4xl font-bold text-[var(--text-primary)] mt-2">
              Explore{" "}
              <span className="gradient-text">Community Issues</span>
            </h2>
            <p className="mt-4 text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
              Discover and support issues that matter in your neighborhood
            </p>
          </FadeUp>

          <FeaturedComplaints />

          <FadeUp className="text-center mt-10" delay={0.2}>
            <Link
              href="/complaints"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 hover:scale-[1.02] transition-all"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
            >
              View All Issues
              <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ── Map Section ───────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ background: "var(--surface-2)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-violet-500/5 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeUp className="order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-xl">
                <div className="h-80">
                  <MapPreview />
                </div>
              </div>
            </FadeUp>

            <FadeUp className="order-1 lg:order-2" delay={0.15}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 mb-4">
                <MapPin className="w-3 h-3" />
                Interactive Map
              </span>
              <h2 className="text-4xl font-bold text-[var(--text-primary)] mt-2">
                See Issues{" "}
                <span className="gradient-text">Near You</span>
              </h2>
              <p className="mt-4 text-[var(--text-muted)] leading-relaxed">
                Explore your neighborhood on an interactive map. Track where issues
                are reported and monitor their resolution in real-time.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { color: "bg-amber-400", label: "Pending — awaiting review" },
                  { color: "bg-blue-500", label: "In Progress — being worked on" },
                  { color: "bg-emerald-500", label: "Completed — resolved" },
                ].map(({ color, label }) => (
                  <li key={label} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${color} shrink-0`} />
                    <span className="text-[var(--text-secondary)] text-sm">{label}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href="/map"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/35 hover:scale-[1.02] transition-all"
                  style={{ background: "linear-gradient(135deg, #0891b2, #2563eb)" }}
                >
                  Explore the Map
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section className="py-24 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[var(--text-primary)]">
              How{" "}
              <span className="gradient-text">CivicSync</span>
              {" "}Works
            </h2>
            <p className="mt-4 text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
              Three simple steps to make your community better
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(({ icon: Icon, title, desc, gradient, glow }, i) => (
              <FadeUp key={title} delay={i * 0.12}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative group rounded-2xl p-8 bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-md)] overflow-hidden card-hover text-center"
                >
                  {/* Number */}
                  <div className="absolute top-5 right-5 text-6xl font-black text-[var(--text-primary)]/[0.04] select-none">
                    {i + 1}
                  </div>

                  {/* Icon */}
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} shadow-xl ${glow} mb-6`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{title}</h3>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed">{desc}</p>

                  {/* Connector line for md+ */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/3 -right-4 w-8 border-t-2 border-dashed border-[var(--border)]" />
                  )}
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────── */}
      <section className="py-24" style={{ background: "var(--surface-2)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[var(--text-primary)]">
              Everything You Need to{" "}
              <span className="gradient-text">Take Action</span>
            </h2>
            <p className="mt-4 text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
              A complete civic engagement toolkit built for modern communities
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color, bg }, i) => (
              <FadeUp key={title} delay={i * 0.07}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="rounded-2xl p-6 bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] h-full"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${bg} mb-4`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden">
        {/* Dark gradient bg */}
        <div
          className="absolute inset-0 animate-gradient"
          style={{
            background:
              "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1d4ed8 100%)",
            backgroundSize: "200% 200%",
          }}
        />
        {/* Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeUp>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Ready to improve your community?
            </h2>
            <p className="mt-5 text-lg text-white/70 max-w-xl mx-auto">
              Join CivicSync today. It&apos;s free, it&apos;s powerful, and your neighborhood
              needs your voice.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-violet-700 bg-white hover:bg-violet-50 shadow-xl shadow-black/20 hover:scale-[1.02] transition-all"
              >
                Get Started — It&apos;s Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/new-complaint"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/10 transition-all"
              >
                Report an Issue
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </MainLayout>
  );
}
