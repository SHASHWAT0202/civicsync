"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import MainLayout from "@/components/MainLayout";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { ComplaintCategory, ComplaintStatus } from "@/types";

interface Complaint {
  _id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  images: string[];
  votes: number;
  hasVoted?: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface Feedback {
  _id: string;
  complaintId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    imageUrl: string;
    role: string;
  };
}

export default function ComplaintDetailPage({ params }: { params: { id: string } }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [newFeedback, setNewFeedback] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const complaintId = params.id; // Store id to avoid multiple access to params.id

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchComplaint();
      fetchFeedbacks();
    } else if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router, complaintId]);

  const fetchComplaint = async () => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch complaint");
      }

      const data = await response.json();
      setComplaint(data.complaint);
      
      if (data.complaint.images.length > 0) {
        setActiveImage(data.complaint.images[0]);
      }
    } catch (error) {
      console.error("Error fetching complaint:", error);
      toast.error("Failed to load complaint");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`/api/feedbacks?complaintId=${complaintId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch feedbacks");
      }

      const data = await response.json();
      setFeedbacks(data.feedbacks);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    }
  };

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!complaint) return;
    
    try {
      setIsVoting(true);
      const response = await fetch(`/api/complaints/${complaintId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voteType }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || "Failed to vote";
        console.error("Error voting:", errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Update the complaint with new vote count from the response
      setComplaint((prev) => 
        prev ? { 
          ...prev, 
          votes: data.votes || prev.votes + 1,
          hasVoted: true
        } : null
      );
      
      toast.success(`Your vote has been recorded`);
      
      // Notify about potential badges
      const randomNotify = Math.random() > 0.7; // Only show sometimes to avoid spamming
      if (randomNotify) {
        setTimeout(() => {
          toast.success("Check your profile for new community badges!", 
            { duration: 3000, icon: "🏅" });
        }, 1500);
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to record vote");
    } finally {
      setIsVoting(false);
    }
  };

  const handleRemoveVote = async () => {
    if (!complaint) return;
    
    try {
      setIsVoting(true);
      
      const response = await fetch(`/api/votes/${complaint._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove vote");
      }

      const data = await response.json();
      
      // Update the complaint with new vote count and hasVoted status
      setComplaint((prev) => 
        prev ? { 
          ...prev, 
          votes: data.voteCount,
          hasVoted: false
        } : null
      );
      
      toast.success("Vote removed successfully");
    } catch (error) {
      console.error("Error removing vote:", error);
      toast.error("Failed to remove vote");
    } finally {
      setIsVoting(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFeedback.trim()) {
      toast.error("Feedback cannot be empty");
      return;
    }
    
    try {
      setSubmittingFeedback(true);
      
      const response = await fetch("/api/feedbacks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          complaintId: complaintId,
          content: newFeedback,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      toast.success("Feedback submitted successfully");
      setNewFeedback("");
      fetchFeedbacks(); // Refresh feedbacks
      
      // Notify about potential badges
      const randomNotify = Math.random() > 0.6; // Only show sometimes
      if (randomNotify) {
        setTimeout(() => {
          toast.success("New comment badges may be available in your profile!", 
            { duration: 3000, icon: "🏅" });
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Loading...</h1>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!complaint) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Complaint not found</h1>
            <p className="mt-4 text-gray-600">
              The complaint you are looking for does not exist or has been removed.
            </p>
            <div className="mt-6">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isOwner = complaint.userId === user?.id;
  const statusColors = {
    "pending": "bg-yellow-100 text-yellow-800",
    "in-progress": "bg-blue-100 text-blue-800",
    "completed": "bg-green-100 text-green-800",
    "rejected": "bg-red-100 text-red-800",
  };

  return (
    <MainLayout>
      <div className="bg-blue-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-4 text-blue-100 hover:text-white">
              ← Back
            </Link>
            <h1 className="text-3xl font-bold">Complaint Details</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {complaint.title}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Submitted on {new Date(complaint.createdAt).toLocaleDateString()} at {new Date(complaint.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[complaint.status]}`}>
                {complaint.status.replace("-", " ")}
              </span>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {complaint.category.replace("-", " ")}
                  </span>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                  {complaint.description}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {complaint.location.address || "No address provided"}
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">
                      Coordinates: {complaint.location.lat}, {complaint.location.lng}
                    </span>
                  </div>
                  <div className="mt-2">
                    <a
                      href={`https://www.google.com/maps?q=${complaint.location.lat},${complaint.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      View on Google Maps
                    </a>
                  </div>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Votes</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <div className="flex items-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      {complaint.votes}
                    </div>
                    {complaint.hasVoted ? (
                      <button
                        onClick={() => handleVote("downvote")}
                        disabled={isVoting}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {isVoting ? "Removing..." : "Remove Vote"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVote("upvote")}
                        disabled={isVoting}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {isVoting ? "Voting..." : "Vote"}
                      </button>
                    )}
                  </div>
                </dd>
              </div>
              {complaint.images.length > 0 && (
                <div className="bg-gray-50 px-4 py-5 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 mb-4">Images</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div className="grid grid-cols-5 gap-4 mb-4">
                      {complaint.images.map((image, index) => (
                        <div 
                          key={index} 
                          className={`cursor-pointer border-2 rounded-md overflow-hidden ${
                            activeImage === image ? "border-blue-500" : "border-transparent"
                          }`}
                          onClick={() => setActiveImage(image)}
                        >
                          <img 
                            src={image} 
                            alt={`Complaint image ${index + 1}`} 
                            className="h-20 w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    {activeImage && (
                      <div className="mt-4 flex justify-center">
                        <img 
                          src={activeImage} 
                          alt="Selected complaint image" 
                          className="max-h-96 rounded-lg"
                        />
                      </div>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Feedback and Updates
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Communication between you and the administrators
            </p>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            {/* Add new feedback form */}
            <form onSubmit={handleSubmitFeedback} className="mb-8">
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                  Add Your Feedback
                </label>
                <textarea
                  id="feedback"
                  name="feedback"
                  rows={3}
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ask questions or provide additional information about this complaint..."
                ></textarea>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </form>

            {/* Feedback list */}
            {feedbacks.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No feedback has been provided yet.
              </div>
            ) : (
              <div className="space-y-6">
                {feedbacks.map((feedback) => (
                  <div key={feedback._id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <img
                        src={feedback.user?.imageUrl || "https://via.placeholder.com/40"}
                        alt={feedback.user ? `${feedback.user.firstName} ${feedback.user.lastName}` : "User"}
                        className="h-10 w-10 rounded-full mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-900">
                            {feedback.user ? (
                              <div>
                                {feedback.user.firstName} {feedback.user.lastName}
                                {feedback.user.role === "admin" && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Admin
                                  </span>
                                )}
                              </div>
                            ) : (
                              "Anonymous User"
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(feedback.createdAt).toLocaleDateString()} at {new Date(feedback.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                          {feedback.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 