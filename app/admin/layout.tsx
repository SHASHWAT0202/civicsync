"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (isLoaded) {
        if (!isSignedIn) {
          router.push("/sign-in");
          setIsChecking(false);
          return;
        }
        
        const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "shashwat02022005@gmail.com";
        const userEmail = user?.primaryEmailAddress?.emailAddress;
        
        // Check if the user is a super admin
        if (userEmail === superAdminEmail) {
          setIsAuthorized(true);
          setIsChecking(false);
          return;
        }
        
        // Check if the user has admin role in the database
        try {
          if (userEmail) {
            const response = await fetch('/api/users/role?email=' + encodeURIComponent(userEmail));
            if (response.ok) {
              const data = await response.json();
              if (data.role === 'admin') {
                setIsAuthorized(true);
              } else {
                router.push("/dashboard");
              }
            } else {
              router.push("/dashboard");
            }
          } else {
            router.push("/dashboard");
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          router.push("/dashboard");
        }
        
        setIsChecking(false);
      }
    };
    
    checkUserRole();
  }, [isLoaded, isSignedIn, user, router]);

  if (isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Checking authorization...</span>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Prevent content flash while redirecting
  }

  return <>{children}</>;
} 