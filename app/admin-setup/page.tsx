"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminSetupPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }
      
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "shashwat02022005@gmail.com";
      
      if (userEmail === superAdminEmail) {
        setIsAuthorized(true);
      } else {
        router.push("/dashboard");
      }
      
      setIsCheckingAuth(false);
    }
  }, [isLoaded, isSignedIn, user, router]);

  const handleSetAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/admin/set-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to set admin");
      }
      
      toast.success(data.message || "User has been set as admin");
      
      // Clear the form
      setEmail("");
    } catch (error) {
      console.error("Error setting admin:", error);
      toast.error(error instanceof Error ? error.message : "Failed to set admin");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <MainLayout>
        <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Checking authorization...</span>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-6">Admin Setup</h1>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <form onSubmit={handleSetAdmin}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Setting Admin..." : "Set as Admin"}
              </Button>
            </form>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>This page allows you to set a user as an admin.</p>
            <p className="mt-2">After setting a user as admin, they will be able to access the admin dashboard at <code>/admin</code>.</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 