"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/MainLayout";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Award, Medal, Star, Trophy, Clock, CheckCircle, Zap, Target, ThumbsUp, FileText, HelpCircle, RefreshCw } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import React from 'react';
import { handleApiResponse, safelyParseJson, handleFetchError, createFallback } from "@/lib/errorHandling";

interface UserProfile {
  _id: string;
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  totalComplaints: number;
  completedComplaints: number;
  pendingComplaints: number;
  votes: number;
  comments: number;
  level: number;
  points: number;
  nextLevelPoints: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  unlocked: boolean;
  color?: string;
  progress?: number;
  category: 'engagement' | 'complaints' | 'community';
}

// Create a custom error boundary component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Error Loading Profile</h2>
            <p className="text-gray-600 mt-2">We encountered a problem loading your profile data</p>
            <div className="mt-4 text-left bg-gray-50 p-4 rounded overflow-auto max-h-32 text-xs text-gray-600">
              {error.message}
            </div>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={resetErrorBoundary}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md flex items-center justify-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Try Again
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Class component to serve as error boundary
class ErrorBoundary extends React.Component<{
  children: React.ReactNode; 
  fallback: React.ReactNode;
}> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Profile page error:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    
    return this.props.children;
  }
}

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
  });
  const [stats, setStats] = useState<UserStats>({
    totalComplaints: 0,
    completedComplaints: 0,
    pendingComplaints: 0,
    votes: 0,
    comments: 0,
    level: 1,
    points: 120,
    nextLevelPoints: 200
  });
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [recentAchievement, setRecentAchievement] = useState<Badge | null>(null);
  const [showAchievementAnimation, setShowAchievementAnimation] = useState(false);
  const [activeTab, setActiveTab] = useState("badges");
  const [hasError, setHasError] = useState(false);
  const [errorBoundaryKey, setErrorBoundaryKey] = useState(0);

  // Reset error boundary when needed
  const handleErrorReset = useCallback(() => {
    setErrorBoundaryKey(prev => prev + 1);
    setHasError(false);
    setIsLoading(true);
    fetchProfile();
    fetchUserRewards();
  }, []);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    } else if (isLoaded && isSignedIn) {
      try {
        fetchProfile();
        fetchUserRewards();
      } catch (error) {
        console.error("Error in profile initialization:", error);
        setHasError(true);
        toast.error("Something went wrong loading your profile");
        generateBadges(); // Fallback to demo badges on error
      }
    }
  }, [isLoaded, isSignedIn, router, errorBoundaryKey]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      
      // Use a try-catch with fetch to prevent unhandled promise rejections
      let response;
      try {
        response = await fetch("/api/users/profile", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache"
          }
        });
      } catch (fetchError) {
        handleFetchError(fetchError, "Network error - please check your connection");
        
        // Set default profile data to prevent UI errors
        if (user) {
          setProfile({
            _id: "",
            clerkId: user.id || "",
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            email: user?.emailAddresses[0]?.emailAddress || "",
            imageUrl: user?.imageUrl || "",
            role: "user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          setFormData({
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
          });
        }
        
        setIsLoading(false);
        return;
      }
      
      // Special handling for 404 - don't redirect if we're already on profile page
      if (response.status === 404) {
        // Check if we're already on the profile page
        const currentPath = window.location.pathname;
        if (currentPath.includes('/dashboard/profile')) {
          // Don't redirect, just use Clerk data instead
          console.log("Profile not found but we're already on profile page - using Clerk data");
          toast.error("Your profile is being set up");
          
          if (user) {
            setProfile({
              _id: "",
              clerkId: user.id || "",
              firstName: user?.firstName || "",
              lastName: user?.lastName || "",
              email: user?.emailAddresses[0]?.emailAddress || "",
              imageUrl: user?.imageUrl || "",
              role: "user",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            
            setFormData({
              firstName: user?.firstName || "",
              lastName: user?.lastName || "",
            });
          }
          
          setIsLoading(false);
          return;
        } else {
          // Only redirect if we're not already on profile page
          router.push("/complete-profile");
          return;
        }
      }
      
      // Handle other error responses
      const responseCheck = await handleApiResponse(response, "Failed to fetch profile");
      if (!responseCheck.continue) {
        // Set default profile data to prevent UI errors
        if (user) {
          setProfile({
            _id: "",
            clerkId: user.id || "",
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            email: user?.emailAddresses[0]?.emailAddress || "",
            imageUrl: user?.imageUrl || "",
            role: "user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          setFormData({
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
          });
        }
        
        setIsLoading(false);
        return;
      }

      // Parse the response body carefully to handle potential errors
      const data = await safelyParseJson(response);
      if (!data || (!data.user && !data._id)) {
        toast.error("Invalid profile data structure");
        setHasError(true);
        
        // Set default profile data
        if (user) {
          setProfile({
            _id: "",
            clerkId: user.id || "",
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            email: user?.emailAddresses[0]?.emailAddress || "",
            imageUrl: user?.imageUrl || "",
            role: "user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          setFormData({
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
          });
        }
        setIsLoading(false);
        return;
      }
      
      // Handle both possible response formats (with user wrapper or direct data)
      const profileData = data.user || data;
      setProfile(profileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
      setHasError(true);
      
      // Set default profile data from Clerk
      if (user) {
        setProfile({
          _id: "",
          clerkId: user.id || "",
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          email: user?.emailAddresses[0]?.emailAddress || "",
          imageUrl: user?.imageUrl || "",
          role: "user",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        setFormData({
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add this helper function to map badge IDs to their corresponding icons
  const getBadgeIcon = (badgeId: string) => {
    switch (badgeId) {
      case 'newcomer':
        return <Star className="h-6 w-6" />;
      case 'first-complaint':
        return <FileText className="h-6 w-6" />;
      case 'resolution-pioneer':
        return <CheckCircle className="h-6 w-6" />;
      case 'active-citizen':
        return <Zap className="h-6 w-6" />;
      case 'feedback-provider':
        return <ThumbsUp className="h-6 w-6" />;
      case 'problem-solver':
        return <Trophy className="h-6 w-6" />;
      case 'community-pillar':
        return <Award className="h-6 w-6" />;
      case 'top-reporter':
        return <Medal className="h-6 w-6" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  // Add this helper function to get badge color based on category
  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'engagement':
        return 'bg-blue-500';
      case 'complaints':
        return 'bg-green-500';
      case 'community':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const fetchUserRewards = async () => {
    try {
      setIsLoading(true);
      
      // First, call the UPDATE_STATS action to ensure the data is current
      try {
        await fetch("/api/users/rewards", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action: "UPDATE_STATS"
          })
        });
      } catch (updateError) {
        console.error("Failed to update stats:", updateError);
        // Continue anyway to fetch existing data
      }
      
      // Now fetch the latest rewards data
      let response;
      try {
        response = await fetch("/api/users/rewards", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache"
          }
        });
      } catch (fetchError) {
        handleFetchError(fetchError, "Network error - please check your connection");
        generateBadges(); // Use sample data
        setIsLoading(false);
        return;
      }
      
      // Handle response errors
      const responseCheck = await handleApiResponse(response, "Failed to fetch rewards");
      if (!responseCheck.continue) {
        // Generate demo data instead of showing error page
        generateBadges();
        
        setStats({
          totalComplaints: 0,
          completedComplaints: 0,
          pendingComplaints: 0,
          votes: 0,
          comments: 0,
          level: 1,
          points: 120,
          nextLevelPoints: 200
        });
        
        setIsLoading(false);
        return;
      }

      // Parse response data safely
      const data = await safelyParseJson(response);
      
      if (!data) {
        console.error("Failed to parse rewards data");
        toast.error("Failed to parse rewards data");
        generateBadges(); // Use sample data on parse error
        setIsLoading(false);
        return;
      }
      
      // Check for fallback data from API in case of issues
      if (data.fallbackData) {
        console.log("Using fallback rewards data from API");
        const fallbackRewards = data.fallbackData.rewards;
        
        // Map badges from fallback data
        if (fallbackRewards.badges && Array.isArray(fallbackRewards.badges)) {
          setUserBadges(
            fallbackRewards.badges.map((badge: any) => ({
              id: badge.id,
              name: badge.name,
              description: badge.description,
              icon: getBadgeIcon(badge.id),
              color: getBadgeColor(badge.category),
              category: badge.category,
              unlocked: badge.unlocked,
              progress: badge.progress || 0
            }))
          );
        } else {
          generateBadges();
        }
        
        // Set stats from fallback data
        setStats({
          totalComplaints: fallbackRewards.stats?.totalComplaints || 0,
          completedComplaints: fallbackRewards.stats?.completedComplaints || 0,
          pendingComplaints: fallbackRewards.stats?.pendingComplaints || 0,
          votes: fallbackRewards.stats?.votes || 0,
          comments: fallbackRewards.stats?.comments || 0,
          level: fallbackRewards.level || 1,
          points: fallbackRewards.points || 0,
          nextLevelPoints: data.fallbackData.nextLevelPoints || 100
        });
        
        setIsLoading(false);
        return;
      }
      
      // Process the successful rewards data
      if (data.rewards) {
        // Check for new points and show toast
        if (data.pointsAdded && data.pointsAdded > 0) {
          toast.success(`You earned ${data.pointsAdded} XP!`);
        }
        
        // Check for level up
        if (data.levelUp) {
          toast.success(`Congratulations! You reached level ${data.rewards.level}!`, {
            icon: '🏆',
            duration: 5000
          });
        }

        // Map badges from API to component format
        setUserBadges(
          data.rewards.badges.map((badge: any) => ({
            id: badge.id,
            name: badge.name,
            description: badge.description,
            icon: getBadgeIcon(badge.id),
            color: getBadgeColor(badge.category),
            category: badge.category,
            unlocked: badge.unlocked,
            progress: badge.progress || 0
          }))
        );
        
        // Update user stats
        setStats({
          totalComplaints: data.rewards.stats.totalComplaints,
          completedComplaints: data.rewards.stats.completedComplaints,
          pendingComplaints: data.rewards.stats.pendingComplaints,
          votes: data.rewards.stats.votes,
          comments: data.rewards.stats.comments,
          level: data.rewards.level,
          points: data.rewards.points,
          nextLevelPoints: data.nextLevelPoints
        });
      } else {
        // Handle case where rewards data is missing
        console.error("Invalid rewards data format:", data);
        toast.error("Rewards data format is incorrect");
        // Use demo data instead of breaking
        generateBadges();
        setStats({
          totalComplaints: 0,
          completedComplaints: 0,
          pendingComplaints: 0,
          votes: 0,
          comments: 0,
          level: 1,
          points: 120,
          nextLevelPoints: 200
        });
      }
    } catch (error) {
      handleFetchError(error, "Failed to load rewards data");
      
      // Use demo data if API fails
      generateBadges();
      setStats({
        totalComplaints: 0,
        completedComplaints: 0,
        pendingComplaints: 0,
        votes: 0,
        comments: 0,
        level: 1,
        points: 120,
        nextLevelPoints: 200
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateBadges = () => {
    const badges: Badge[] = [
      {
        id: 'newcomer',
        name: 'Newcomer',
        description: 'Welcome to CivicSync! You\'ve joined the community',
        icon: <Star className="h-6 w-6" />,
        unlocked: true,
        color: 'bg-green-500',
        category: 'engagement'
      },
      {
        id: 'first-complaint',
        name: 'First Report',
        description: 'You submitted your first complaint',
        icon: <FileText className="h-6 w-6" />,
        unlocked: true,
        color: 'bg-blue-500',
        category: 'complaints'
      },
      {
        id: 'resolution-pioneer',
        name: 'Resolution Pioneer',
        description: 'You had your first complaint resolved',
        icon: <CheckCircle className="h-6 w-6" />,
        unlocked: true,
        color: 'bg-green-500',
        category: 'complaints'
      },
      {
        id: 'active-citizen',
        name: 'Active Citizen',
        description: 'Submit 5 complaints',
        icon: <Zap className="h-6 w-6" />,
        unlocked: true,
        color: 'bg-yellow-500',
        category: 'complaints'
      },
      {
        id: 'feedback-provider',
        name: 'Feedback Provider',
        description: 'Leave 5 comments on complaints',
        icon: <ThumbsUp className="h-6 w-6" />,
        unlocked: true,
        color: 'bg-purple-500',
        category: 'community'
      },
      {
        id: 'problem-solver',
        name: 'Problem Solver',
        description: 'Get 10 complaints resolved',
        icon: <Trophy className="h-6 w-6" />,
        unlocked: false,
        progress: 40,
        color: 'bg-amber-500',
        category: 'complaints'
      },
      {
        id: 'community-pillar',
        name: 'Community Pillar',
        description: 'Receive 50 votes across all your complaints',
        icon: <Award className="h-6 w-6" />,
        unlocked: false,
        progress: 30,
        color: 'bg-red-500',
        category: 'community'
      },
      {
        id: 'top-reporter',
        name: 'Top Reporter',
        description: 'Be in the top 10% of reporters in your area',
        icon: <Medal className="h-6 w-6" />,
        unlocked: false,
        progress: 65,
        color: 'bg-indigo-500',
        category: 'engagement'
      },
    ];

    setUserBadges(badges);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsUpdating(true);
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success("Profile updated successfully");
      fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  // Achievement animation
  const triggerAchievementNotification = (badge: Badge) => {
    setRecentAchievement(badge);
    setShowAchievementAnimation(true);
    setTimeout(() => {
      setShowAchievementAnimation(false);
    }, 5000);
  };

  // Achievement notification overlay
  const AchievementNotification = () => {
    if (!showAchievementAnimation || !recentAchievement) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
        <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl animate-in zoom-in-90 duration-300">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
              {recentAchievement.icon}
            </div>
            <h2 className="text-2xl font-bold mb-2 text-yellow-600">New Achievement!</h2>
            <h3 className="text-xl font-semibold mb-4">{recentAchievement.name}</h3>
            <p className="text-gray-600 mb-6">{recentAchievement.description}</p>
            <button 
              onClick={() => setShowAchievementAnimation(false)}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              View in Profile
            </button>
          </div>
        </div>
      </div>
    );
  };

  const progressPercentage = (stats.points / stats.nextLevelPoints) * 100;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (hasError) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Something went wrong</h2>
              <p className="text-gray-600 mt-2">We're having trouble loading your rewards data</p>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={handleErrorReset}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
              >
                <RefreshCw className="h-4 w-4 mr-2 inline-block" /> Try Again
              </button>
              
              <button 
                onClick={() => {
                  setHasError(false);
                  generateBadges();
                  setActiveTab("badges");
                }}
                className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md"
              >
                View Sample Data
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <ErrorBoundary
      key={errorBoundaryKey}
      fallback={
        <ErrorFallback
          error={new Error("Failed to load profile data")}
          resetErrorBoundary={handleErrorReset}
        />
      }
    >
      <MainLayout>
        {/* Achievement notification */}
        <AchievementNotification />

        <div className="container mx-auto py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row items-center md:items-start">
                {user?.imageUrl ? (
                  <div className="w-24 h-24 mb-4 md:mb-0 md:mr-6">
                    <Image
                      src={user.imageUrl}
                      alt={`${user.firstName} ${user.lastName}`}
                      width={96}
                      height={96}
                      className="rounded-full"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-2xl font-bold mb-4 md:mb-0 md:mr-6">
                    {user?.firstName?.charAt(0) || ""}
                    {user?.lastName?.charAt(0) || ""}
                  </div>
                )}
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h1>
                  <p className="text-gray-700 mb-2">{user?.emailAddresses[0].emailAddress}</p>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Star className="h-3 w-3 mr-1" /> Level {stats.level}
                    </Badge>
                    
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Trophy className="h-3 w-3 mr-1" /> {stats.points} XP
                    </Badge>
                    
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <FileText className="h-3 w-3 mr-1" /> {stats.totalComplaints} Reports
                    </Badge>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-700">{stats.points} / {stats.nextLevelPoints} XP to Level {stats.level + 1}</p>
                </div>
              </div>
            </div>

            <Tabs defaultValue="badges" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full mb-6">
                <TabsTrigger value="badges" className="flex-1">Achievements</TabsTrigger>
                <TabsTrigger value="stats" className="flex-1">Progress</TabsTrigger>
                <TabsTrigger value="profile" className="flex-1">Profile Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="badges">
                <div>
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      How badges work
                    </h4>
                    <p className="text-sm text-blue-700">
                      Earn badges by participating in CivicSync. Submit complaints, vote on issues, 
                      leave comments, and be an active community member to unlock achievements. 
                      New badges will be awarded automatically as you meet requirements.
                    </p>
                  </div>
                  
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">Your Level</h3>
                        <p className="text-sm text-gray-700">Based on your activity</p>
                      </div>
                      <div className="flex items-center">
                        <button 
                          onClick={async () => {
                            toast.loading("Refreshing rewards data...");
                            
                            try {
                              // First update stats from database
                              const updateResponse = await fetch("/api/users/rewards", {
                                method: "PATCH",
                                headers: {
                                  "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                  action: "UPDATE_STATS"
                                })
                              });
                              
                              if (updateResponse.ok) {
                                toast.success("Stats updated from database");
                              }
                              
                              // Then fetch the latest data
                              await fetchUserRewards();
                            } catch (error) {
                              console.error("Error refreshing rewards:", error);
                              toast.error("Failed to refresh rewards");
                            }
                          }}
                          className="text-blue-500 hover:text-blue-700 mr-3 flex items-center text-sm"
                          aria-label="Refresh rewards data"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" /> Refresh Stats
                        </button>
                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-xl font-bold">
                          {stats.level}
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-3 bg-gray-200 rounded-full">
                      <div 
                        className="h-3 bg-blue-500 rounded-full"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-900">Your Achievements</CardTitle>
                    <CardDescription className="text-gray-700">
                      Unlock badges by being an active citizen in your community
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold text-lg mb-3 text-gray-900">Engagement Badges</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {userBadges
                            .filter(badge => badge.category === 'engagement')
                            .map(badge => (
                              <div 
                                key={badge.id} 
                                className={`rounded-lg border p-3 flex flex-col items-center text-center ${
                                  badge.unlocked ? "border-gray-200" : "border-gray-200 opacity-60"
                                }`}
                              >
                                <div className={`w-12 h-12 ${badge.unlocked ? badge.color : "bg-gray-200"} rounded-full flex items-center justify-center mb-2`}>
                                  {badge.icon}
                                </div>
                                <p className="font-medium text-sm text-gray-900">{badge.name}</p>
                                <p className="text-xs text-gray-700 mt-1">{badge.description}</p>
                                {!badge.unlocked && badge.progress !== undefined && (
                                  <div className="w-full mt-2">
                                    <div className="text-xs text-gray-700 mb-1 text-right">{badge.progress}%</div>
                                    <Progress value={badge.progress} className="h-1.5" />
                                  </div>
                                )}
                                {badge.unlocked && (
                                  <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Unlocked
                                  </Badge>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg mb-3 text-gray-900">Complaint Badges</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {userBadges
                            .filter(badge => badge.category === 'complaints')
                            .map(badge => (
                              <div 
                                key={badge.id} 
                                className={`rounded-lg border p-3 flex flex-col items-center text-center ${
                                  badge.unlocked ? "border-gray-200" : "border-gray-200 opacity-60"
                                }`}
                              >
                                <div className={`w-12 h-12 ${badge.unlocked ? badge.color : "bg-gray-200"} rounded-full flex items-center justify-center mb-2`}>
                                  {badge.icon}
                                </div>
                                <p className="font-medium text-sm text-gray-900">{badge.name}</p>
                                <p className="text-xs text-gray-700 mt-1">{badge.description}</p>
                                {!badge.unlocked && badge.progress !== undefined && (
                                  <div className="w-full mt-2">
                                    <div className="text-xs text-gray-700 mb-1 text-right">{badge.progress}%</div>
                                    <Progress value={badge.progress} className="h-1.5" />
                                  </div>
                                )}
                                {badge.unlocked && (
                                  <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Unlocked
                                  </Badge>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg mb-3 text-gray-900">Community Badges</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {userBadges
                            .filter(badge => badge.category === 'community')
                            .map(badge => (
                              <div 
                                key={badge.id} 
                                className={`rounded-lg border p-3 flex flex-col items-center text-center ${
                                  badge.unlocked ? "border-gray-200" : "border-gray-200 opacity-60"
                                }`}
                              >
                                <div className={`w-12 h-12 ${badge.unlocked ? badge.color : "bg-gray-200"} rounded-full flex items-center justify-center mb-2`}>
                                  {badge.icon}
                                </div>
                                <p className="font-medium text-sm text-gray-900">{badge.name}</p>
                                <p className="text-xs text-gray-700 mt-1">{badge.description}</p>
                                {!badge.unlocked && badge.progress !== undefined && (
                                  <div className="w-full mt-2">
                                    <div className="text-xs text-gray-700 mb-1 text-right">{badge.progress}%</div>
                                    <Progress value={badge.progress} className="h-1.5" />
                                  </div>
                                )}
                                {badge.unlocked && (
                                  <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Unlocked
                                  </Badge>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="stats">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Progress</CardTitle>
                    <CardDescription>
                      Track your contributions and impact in the community
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Total Complaints</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{stats.totalComplaints}</div>
                            <div className="flex items-center mt-2">
                              <FileText className="h-4 w-4 text-blue-500 mr-1" />
                              <span className="text-xs text-blue-500">
                                {stats.completedComplaints} Resolved ({Math.round((stats.completedComplaints/stats.totalComplaints)*100)}%)
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Total Votes</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{stats.votes}</div>
                            <div className="flex items-center mt-2">
                              <ThumbsUp className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-xs text-green-500">
                                {Math.round(stats.votes/stats.totalComplaints)} avg. per complaint
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Comments</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{stats.comments}</div>
                            <div className="flex items-center mt-2">
                              <Clock className="h-4 w-4 text-purple-500 mr-1" />
                              <span className="text-xs text-purple-500">Active participant</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg mb-4">XP Progress</h3>
                        <div className="p-6 border rounded-lg">
                          <div className="flex items-center mb-4">
                            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-xl font-bold">
                              {stats.level}
                            </div>
                            <div className="mx-4 flex-1">
                              <div className="h-3 bg-gray-200 rounded-full">
                                <div 
                                  className="h-3 bg-blue-500 rounded-full"
                                  style={{ width: `${progressPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xl font-bold">
                              {stats.level + 1}
                            </div>
                          </div>
                          
                          <div className="text-center text-sm text-gray-600">
                            <p>{stats.points} / {stats.nextLevelPoints} XP to next level</p>
                            <p className="mt-1">Keep reporting issues and engaging with the community!</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg mb-4">Recent Activity</h3>
                        <div className="border rounded-lg divide-y">
                          <div className="p-4 flex items-start">
                            <div className="mr-4">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </div>
                            </div>
                            <div>
                              <p className="font-medium">Complaint Resolved</p>
                              <p className="text-sm text-gray-500">Your complaint about "Broken Streetlights" was resolved</p>
                              <p className="text-xs text-gray-400 mt-1">2 days ago • +40 XP</p>
                            </div>
                          </div>
                          
                          <div className="p-4 flex items-start">
                            <div className="mr-4">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <FileText className="h-4 w-4 text-blue-500" />
                              </div>
                            </div>
                            <div>
                              <p className="font-medium">New Complaint</p>
                              <p className="text-sm text-gray-500">You reported "Garbage not collected on time"</p>
                              <p className="text-xs text-gray-400 mt-1">4 days ago • +15 XP</p>
                            </div>
                          </div>
                          
                          <div className="p-4 flex items-start">
                            <div className="mr-4">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <Trophy className="h-4 w-4 text-purple-500" />
                              </div>
                            </div>
                            <div>
                              <p className="font-medium">Badge Unlocked</p>
                              <p className="text-sm text-gray-500">You earned the "Active Citizen" badge</p>
                              <p className="text-xs text-gray-400 mt-1">1 week ago • +25 XP</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>
                      Update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit}>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <label htmlFor="firstName" className="text-sm font-medium">
                            First Name
                          </label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="lastName" className="text-sm font-medium">
                            Last Name
                          </label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            value={user?.emailAddresses[0].emailAddress || ""}
                            disabled
                            className="bg-gray-100"
                          />
                          <p className="text-xs text-gray-500">
                            Email cannot be changed here. Update it in your account settings.
                          </p>
                        </div>
                      </div>
                      
                      <Button className="mt-6" type="submit" disabled={isUpdating}>
                        {isUpdating ? "Updating..." : "Update Profile"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </MainLayout>
    </ErrorBoundary>
  );
} 