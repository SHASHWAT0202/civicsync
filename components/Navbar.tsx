"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserButton, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./mode-toggle";
import { Menu } from "lucide-react";
import Logo from "./Logo";

const Navbar = () => {
  const { isSignedIn, user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "shashwat02022005@gmail.com";

  useEffect(() => {
    const checkUserRole = async () => {
      if (!isSignedIn || !user) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        return;
      }

      // Check if the user is a super admin
      if (user.primaryEmailAddress?.emailAddress === superAdminEmail) {
        setIsSuperAdmin(true);
        return;
      }

      try {
        // Check if the user has admin role in the database
        const userEmail = user.primaryEmailAddress?.emailAddress;
        if (!userEmail) return;

        const response = await fetch('/api/users/role?email=' + encodeURIComponent(userEmail));
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };

    checkUserRole();
  }, [isSignedIn, user, superAdminEmail]);

  return (
    <nav className="bg-black text-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Logo size={40} />
              <Link href="/" className="text-2xl font-bold text-white ml-2">
                CivicSync
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white border-b-2 border-transparent hover:border-primary hover:text-gray-300"
              >
                Home
              </Link>
              <Link
                href="/complaints"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white border-b-2 border-transparent hover:border-primary hover:text-gray-300"
              >
                Complaints
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white border-b-2 border-transparent hover:border-primary hover:text-gray-300"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white border-b-2 border-transparent hover:border-primary hover:text-gray-300"
              >
                Contact
              </Link>
              {isSignedIn && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white border-b-2 border-transparent hover:border-primary hover:text-gray-300"
                >
                  Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white border-b-2 border-transparent hover:border-primary hover:text-gray-300"
                >
                  Admin
                </Link>
              )}
              {isSuperAdmin && (
                <Link
                  href="/super-admin"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-red-400 border-b-2 border-transparent hover:border-red-500 hover:text-red-300"
                >
                  Super Admin
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <ModeToggle />
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm" className="text-white border-gray-600 hover:bg-gray-800 hover:text-white">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Sign Up</Button>
                </SignUpButton>
              </>
            )}
          </div>
          <div className="flex items-center sm:hidden">
            <ModeToggle />
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary ml-2"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="block h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1 bg-black">
            <Link
              href="/"
              className="block pl-3 pr-4 py-2 text-base font-medium text-white hover:bg-gray-800"
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link
              href="/complaints"
              className="block pl-3 pr-4 py-2 text-base font-medium text-white hover:bg-gray-800"
              onClick={toggleMenu}
            >
              Complaints
            </Link>
            <Link
              href="/about"
              className="block pl-3 pr-4 py-2 text-base font-medium text-white hover:bg-gray-800"
              onClick={toggleMenu}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block pl-3 pr-4 py-2 text-base font-medium text-white hover:bg-gray-800"
              onClick={toggleMenu}
            >
              Contact
            </Link>
            {isSignedIn && (
              <Link
                href="/dashboard"
                className="block pl-3 pr-4 py-2 text-base font-medium text-white hover:bg-gray-800"
                onClick={toggleMenu}
              >
                Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="block pl-3 pr-4 py-2 text-base font-medium text-white hover:bg-gray-800"
                onClick={toggleMenu}
              >
                Admin
              </Link>
            )}
            {isSuperAdmin && (
              <Link
                href="/super-admin"
                className="block pl-3 pr-4 py-2 text-base font-medium text-red-400 hover:bg-gray-800"
                onClick={toggleMenu}
              >
                Super Admin
              </Link>
            )}
            {!isSignedIn && (
              <div className="flex flex-col space-y-2 px-3 py-2">
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm" className="w-full justify-start text-white border-gray-600 hover:bg-gray-800">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                    Sign Up
                  </Button>
                </SignUpButton>
              </div>
            )}
            {isSignedIn && (
              <div className="px-3 py-2">
                <UserButton afterSignOutUrl="/" />
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 