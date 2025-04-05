"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Complaint } from "@/types/complaint";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, ThumbsUp, AlertTriangle, Award } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import CommentSection from "@/components/CommentSection";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import MainLayout from "@/components/MainLayout";

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isLoaded, isSignedIn, user } = useUser();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showVoteBadge, setShowVoteBadge] = useState(false);
  const voteButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/complaints/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Complaint not found");
            // Use mock data for demo purposes
            setComplaint({
              _id: id as string,
              title: "Sample Complaint",
              description: "This is a sample complaint for demonstration purposes. The actual complaint could not be found.",
              category: "other",
              status: "pending",
              location: { lat: 40.7128, lng: -74.006 },
              address: "123 Demo Street, Sample City",
              images: [],
              votes: 15,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              userId: "demo-user",
              comments: []
            });
          } else {
            setError("Failed to load complaint");
            // Use mock data for demo purposes
            setComplaint({
              _id: id as string,
              title: "Sample Complaint",
              description: "This is a sample complaint for demonstration purposes. The actual complaint could not be loaded due to a server error.",
              category: "other",
              status: "pending",
              location: { lat: 40.7128, lng: -74.006 },
              address: "123 Demo Street, Sample City",
              images: [],
              votes: 15,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              userId: "demo-user",
              comments: []
            });
          }
          return;
        }
        
        const data = await response.json();
        setComplaint(data.complaint);
        
        // Check if user has voted
        if (isSignedIn && user?.id) {
          try {
            const votesResponse = await fetch(`/api/complaints/${id}/votes/check`);
            if (votesResponse.ok) {
              const votesData = await votesResponse.json();
              setHasVoted(votesData.hasVoted);
            }
          } catch (error) {
            console.error("Error checking vote status:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching complaint:", error);
        setError("An error occurred while loading the complaint");
        // Use mock data for demo purposes
        setComplaint({
          _id: id as string,
          title: "Sample Complaint",
          description: "This is a sample complaint for demonstration purposes. The actual complaint could not be loaded due to a network error.",
          category: "other",
          status: "pending",
          location: { lat: 40.7128, lng: -74.006 },
          address: "123 Demo Street, Sample City",
          images: [],
          votes: 15,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: "demo-user",
          comments: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchComplaint();
    }
  }, [id, isSignedIn, user?.id]);

  const handleVote = async () => {
    if (!isSignedIn) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote on complaints",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/complaints/${id}/votes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const data = await response.json();
      setComplaint(prev => prev ? { ...prev, votes: data.votes } : null);
      setHasVoted(true);
      
      // Show vote badge animation
      setShowVoteBadge(true);
      setTimeout(() => setShowVoteBadge(false), 3000);
      
      toast({
        title: "Vote recorded",
        description: "Thank you for supporting this complaint",
      });
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/4 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Skeleton className="h-64 w-full mb-6" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-6" />
            </div>
            <div>
              <Skeleton className="h-40 w-full mb-4" />
              <Skeleton className="h-10 w-full mb-2" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!complaint) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Complaint Not Found</h1>
          <p className="mb-6 text-gray-800">The complaint you are looking for could not be found.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/complaints">View All Complaints</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const getCategoryColor = (category: string) => {
    const categories: Record<string, string> = {
      potholes: "bg-red-100 text-red-800",
      streetlights: "bg-yellow-100 text-yellow-800",
      garbage: "bg-green-100 text-green-800",
      graffiti: "bg-purple-100 text-purple-800",
      sidewalks: "bg-blue-100 text-blue-800",
      noise: "bg-pink-100 text-pink-800",
      water: "bg-cyan-100 text-cyan-800",
      electricity: "bg-amber-100 text-amber-800",
      other: "bg-gray-100 text-gray-800",
    };
    return categories[category] || categories.other;
  };

  const getStatusColor = (status: string) => {
    const statuses: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      "in-progress": "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return statuses[status] || statuses.pending;
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        {error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {error} - Showing sample data for demonstration purposes.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">{complaint.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={getCategoryColor(complaint.category)}>
                {complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)}
              </Badge>
              <Badge className={getStatusColor(complaint.status)}>
                {complaint.status === "in-progress" 
                  ? "In Progress" 
                  : complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
              </Badge>
            </div>
          </div>
          <div className="relative">
            <Button 
              ref={voteButtonRef}
              onClick={handleVote} 
              disabled={hasVoted || !isSignedIn}
              className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700"
            >
              <ThumbsUp className="mr-2 h-4 w-4" /> 
              {hasVoted ? "Voted" : "Support"} ({complaint.votes})
            </Button>
            
            {/* Vote badge animation */}
            {showVoteBadge && (
              <div
                className="absolute top-0 right-0 z-10 transform -translate-y-10 transition-all duration-500"
              >
                <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full shadow-md">
                  <Award className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Civic Supporter!</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {complaint.images && complaint.images.length > 0 ? (
              <div className="mb-6 overflow-hidden rounded-lg">
                <Image 
                  src={complaint.images[0]} 
                  alt={complaint.title}
                  width={800}
                  height={500}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    // Replace with a fallback image on error
                    e.currentTarget.src = "/images/placeholder.jpg";
                    e.currentTarget.onerror = null; // Prevent infinite loop
                  }}
                />
              </div>
            ) : (
              <div className="mb-6 bg-gray-100 rounded-lg flex items-center justify-center h-64">
                <p className="text-gray-700">No image available</p>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-gray-800">{complaint.description}</p>
              </CardContent>
            </Card>

            <div className="mt-8">
              <CommentSection complaintId={complaint._id} />
            </div>
          </div>

          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-gray-900">Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start mb-4">
                  <MapPin className="mr-2 h-5 w-5 text-gray-500 mt-0.5" />
                  <p className="text-gray-800">{complaint.address || "Location information not available"}</p>
                </div>
                <div className="bg-gray-100 h-40 rounded-lg mb-4">
                  {/* Map placeholder - would be replaced with actual map component */}
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-gray-700">Map view</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4">
                  <Calendar className="mr-2 h-5 w-5 text-gray-500" />
                  <p className="text-gray-800">Reported {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}</p>
                </div>
                {complaint.updatedAt && complaint.updatedAt !== complaint.createdAt && (
                  <div className="flex items-center mb-4">
                    <Calendar className="mr-2 h-5 w-5 text-gray-500" />
                    <p className="text-gray-800">Updated {formatDistanceToNow(new Date(complaint.updatedAt), { addSuffix: true })}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => router.push("/complaints")} className="w-full bg-blue-600 text-white hover:bg-blue-700 border-none">
                  Back to All Complaints
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 