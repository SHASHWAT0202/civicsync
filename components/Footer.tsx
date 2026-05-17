"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Logo from "./Logo";
import { Github, Twitter, Linkedin, Mail, ArrowUpRight } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Home", href: "/" },
    { label: "Complaints", href: "/complaints" },
    { label: "Map", href: "/map" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
  ],
};

const socials = [
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Mail, href: "mailto:support@civicsync.com", label: "Email" },
];

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-[#0a0812] text-white">
      {/* Gradient glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-violet-900/30 blur-3xl" />
        <div className="absolute -top-24 right-0 w-80 h-80 rounded-full bg-cyan-900/20 blur-3xl" />
      </div>

      {/* Top border beam */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2.5 w-fit">
              <Logo size={40} />
              <Link href="/" className="text-2xl font-bold gradient-text-hero">CivicSync</Link>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Empowering citizens to improve their communities through effective
              complaint management and transparent resolution.
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  aria-label={label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-violet-500/40 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">
                {section}
              </h3>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="group flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-white/8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} CivicSync. All rights reserved.
          </p>
          <p className="text-xs text-white/20">
            Built with{" "}
            <span className="gradient-text font-medium">Next.js 15</span> &amp;{" "}
            <span className="gradient-text font-medium">Framer Motion</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
