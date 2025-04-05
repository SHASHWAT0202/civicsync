"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import MainLayout from "@/components/MainLayout";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { ComplaintCategory, ComplaintStatus } from "@/types";
import { Button } from "@/components/ui/button";

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
  isFake: boolean;
  isVisible: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
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

interface Feedback {
  _id: string;
  complaintId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
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
  const [complaintUser, setComplaintUser] = useState<User | null>(null);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Check if user is admin
      if (user?.publicMetadata?.role !== "admin") {
        toast.error("You don't have permission to access this page");
        router.push("/dashboard");
        return;
      }
      
      fetchComplaint();
      fetchFeedbacks();
    } else if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, user, router, params.id]);

  const fetchComplaint = async () => {
    try {
      const response = await fetch(`/api/complaints/${params.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch complaint");
      }

      const data = await response.json();
      setComplaint(data.complaint);
      
      if (data.complaint.images.length > 0) {
        setActiveImage(data.complaint.images[0]);
      }
      
      // Fetch user who created the complaint
      fetchComplaintUser(data.complaint.userId);
    } catch (error) {
      console.error("Error fetching complaint:", error);
      toast.error("Failed to load complaint");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComplaintUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await response.json();
      setComplaintUser(data.user);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`/api/feedbacks?complaintId=${params.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch feedbacks");
      }

      const data = await response.json();
      setFeedbacks(data.feedbacks);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    }
  };

  const handleStatusChange = async (newStatus: ComplaintStatus) => {
    try {
      setIsStatusUpdating(true);
      
      console.log(`Updating complaint ${params.id} status to: ${newStatus}`);
      
      const response = await fetch(`/api/complaints/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to update status");
      }

      console.log("Status update response:", responseData);
      
      // Update local state with the response data
      if (responseData.complaint) {
        setComplaint(responseData.complaint);
        toast.success(`Status updated to ${newStatus.replace('-', ' ')}`);
      } else {
        toast.warning("Status updated but response data is incomplete");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const toggleFakeStatus = async () => {
    if (!complaint) return;
    
    try {
      const response = await fetch(`/api/complaints/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isFake: !complaint.isFake }),
      });

      if (!response.ok) {
        throw new Error("Failed to update fake status");
      }

      setComplaint((prev) => prev ? { ...prev, isFake: !prev.isFake } : null);
      toast.success(`Marked as ${!complaint.isFake ? "fake" : "genuine"}`);
    } catch (error) {
      console.error("Error updating fake status:", error);
      toast.error("Failed to update fake status");
    }
  };

  const toggleVisibility = async () => {
    if (!complaint) return;
    
    try {
      const response = await fetch(`/api/complaints/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isVisible: !complaint.isVisible }),
      });

      if (!response.ok) {
        throw new Error("Failed to update visibility");
      }

      setComplaint((prev) => prev ? { ...prev, isVisible: !prev.isVisible } : null);
      toast.success(`Visibility ${!complaint.isVisible ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update visibility");
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
          complaintId: params.id,
          content: newFeedback,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      toast.success("Feedback submitted successfully");
      setNewFeedback("");
      fetchFeedbacks(); // Refresh feedbacks
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (!isLoaded || !isSignedIn || user?.publicMetadata?.role !== "admin") {
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
              <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                ← Back to Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Check if complaint was created today
  const complaintDate = new Date(complaint.createdAt);
  const today = new Date();
  const isCreatedToday = 
    complaintDate.getDate() === today.getDate() &&
    complaintDate.getMonth() === today.getMonth() &&
    complaintDate.getFullYear() === today.getFullYear();

  return (
    <MainLayout>
      <div className="bg-blue-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link href="/admin" className="mr-4 text-blue-100 hover:text-white">
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
            <div className="flex space-x-3">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Update Complaint Status</h3>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <Button
                    variant={complaint?.status === "pending" ? "default" : "outline"}
                    onClick={() => handleStatusChange("pending")}
                    disabled={isStatusUpdating || complaint?.status === "pending"}
                    className="flex items-center justify-center"
                  >
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    Pending
                  </Button>
                  <Button
                    variant={complaint?.status === "in-progress" ? "default" : "outline"}
                    onClick={() => handleStatusChange("in-progress")}
                    disabled={isStatusUpdating || complaint?.status === "in-progress"}
                    className="flex items-center justify-center"
                  >
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    In Progress
                  </Button>
                  <Button
                    variant={complaint?.status === "completed" ? "default" : "outline"}
                    onClick={() => handleStatusChange("completed")}
                    disabled={isStatusUpdating || complaint?.status === "completed"}
                    className="flex items-center justify-center"
                  >
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    Completed
                  </Button>
                  <Button
                    variant={complaint?.status === "rejected" ? "default" : "outline"}
                    onClick={() => handleStatusChange("rejected")}
                    disabled={isStatusUpdating || complaint?.status === "rejected"}
                    className="flex items-center justify-center"
                  >
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    Rejected
                  </Button>
                </div>
                {isStatusUpdating && (
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mr-2"></div>
                    Updating status...
                  </div>
                )}
              </div>
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
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Submitted by</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {complaintUser ? (
                    <div className="flex items-center">
                      <img 
                        src={complaintUser.imageUrl} 
                        alt={`${complaintUser.firstName} ${complaintUser.lastName}`}
                        className="h-8 w-8 rounded-full mr-2"
                      />
                      <div>
                        <div>{complaintUser.firstName} {complaintUser.lastName}</div>
                        <div className="text-xs text-gray-500">{complaintUser.email}</div>
                      </div>
                    </div>
                  ) : (
                    "Loading user information..."
                  )}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Votes</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    {complaint.votes}
                  </div>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Flags</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center">
                      <button
                        onClick={toggleFakeStatus}
                        disabled={!isCreatedToday}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 ${
                          complaint.isFake ? "bg-red-500" : "bg-gray-200"
                        } ${!isCreatedToday ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <span
                          className={`${
                            complaint.isFake ? "translate-x-6" : "translate-x-1"
                          } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                        />
                      </button>
                      <span className="ml-2 text-sm text-gray-700">
                        {complaint.isFake ? "Marked as fake" : "Marked as genuine"}
                        {!isCreatedToday && " (locked after 24 hours)"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={toggleVisibility}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 ${
                          complaint.isVisible ? "bg-green-500" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`${
                            complaint.isVisible ? "translate-x-6" : "translate-x-1"
                          } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                        />
                      </button>
                      <span className="ml-2 text-sm text-gray-700">
                        {complaint.isVisible ? "Visible to public" : "Hidden from public"}
                      </span>
                    </div>
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
              Feedback and Comments
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Communication between administrators and the user
            </p>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            {/* Add new feedback form */}
            <form onSubmit={handleSubmitFeedback} className="mb-8">
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                  Add Official Feedback
                </label>
                <textarea
                  id="feedback"
                  name="feedback"
                  rows={3}
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Provide official feedback or updates about this complaint..."
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