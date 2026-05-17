"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./mode-toggle";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/complaints", label: "Complaints" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const Navbar = () => {
  const { isSignedIn, user } = useUser();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const superAdminEmail =
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "shashwat02022005@gmail.com";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!isSignedIn || !user) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        return;
      }
      if (user.primaryEmailAddress?.emailAddress === superAdminEmail) {
        setIsSuperAdmin(true);
        return;
      }
      try {
        const userEmail = user.primaryEmailAddress?.emailAddress;
        if (!userEmail) return;
        const response = await fetch(
          "/api/users/role?email=" + encodeURIComponent(userEmail)
        );
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.role === "admin");
        }
      } catch {
        // silent
      }
    };
    checkUserRole();
  }, [isSignedIn, user, superAdminEmail]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <motion.nav
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || pathname !== "/"
          ? "glass-dark shadow-lg border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="transition-transform duration-200 hover:rotate-6 hover:scale-105">
              <Logo size={36} />
            </div>
            <Link href="/" className="text-xl font-bold gradient-text-hero hidden sm:block">
              CivicSync
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} className="relative px-3 py-2 group">
                <span
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive(href)
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {label}
                </span>
                {isActive(href) && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, #8b5cf6, #06b6d4)",
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
            {isSignedIn && (
              <Link href="/dashboard" className="relative px-3 py-2">
                <span
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive("/dashboard")
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Dashboard
                </span>
                {isActive("/dashboard") && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg, #8b5cf6, #06b6d4)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="relative px-3 py-2">
                <span className="text-sm font-medium text-violet-300 hover:text-violet-100 transition-colors">
                  Admin
                </span>
              </Link>
            )}
            {isSuperAdmin && (
              <Link href="/super-admin" className="relative px-3 py-2">
                <span className="text-sm font-medium text-cyan-300 hover:text-cyan-100 transition-colors">
                  Super Admin
                </span>
              </Link>
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden sm:flex items-center gap-3">
            <ModeToggle />
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/30 transition-all"
                  >
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button
                    size="sm"
                    className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-0 hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25"
                  >
                    Get Started
                  </Button>
                </SignUpButton>
              </>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 sm:hidden">
            <ModeToggle />
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Toggle menu</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isMenuOpen ? "close" : "open"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="sm:hidden overflow-hidden glass-dark border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(({ href, label }, i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(href)
                        ? "bg-white/15 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                </motion.div>
              ))}
              {isSignedIn && (
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.05 }}
                >
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive("/dashboard")
                        ? "bg-white/15 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    Dashboard
                  </Link>
                </motion.div>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-violet-300 hover:bg-white/10"
                >
                  Admin
                </Link>
              )}
              {isSuperAdmin && (
                <Link
                  href="/super-admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-cyan-300 hover:bg-white/10"
                >
                  Super Admin
                </Link>
              )}
              <div className="pt-3 pb-1 border-t border-white/10 flex flex-col gap-2">
                {isSignedIn ? (
                  <div className="px-3">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                ) : (
                  <>
                    <SignInButton mode="modal">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-white/80 hover:text-white hover:bg-white/10 border border-white/20 justify-start"
                      >
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-0 justify-start"
                      >
                        Get Started
                      </Button>
                    </SignUpButton>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
