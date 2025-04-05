"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Search, MapPin, Calendar, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Complaint } from "@/types/complaint";
import Link from "next/link";
import MainLayout from "@/components/MainLayout";
import Image from "next/image";

// Separate client component that uses useSearchParams
function ComplaintsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState({
    category: searchParams.get("category") || "all",
    status: searchParams.get("status") || "all",
  });

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  useEffect(() => {
    setFilter({
      category: searchParams.get("category") || "all",
      status: searchParams.get("status") || "all",
    });
  }, [searchParams]);

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filter.category && filter.category !== "all") {
        queryParams.append("category", filter.category);
      }
      
      if (filter.status && filter.status !== "all") {
        queryParams.append("status", filter.status);
      }
      
      // Add a public flag to indicate this is a public request
      queryParams.append("public", "true");
      
      const response = await fetch(`/api/complaints?${queryParams.toString()}`);
      
      if (!response.ok) {
        setError("Failed to load complaints");
        // Use mock data for demo purposes
        setComplaints([
          {
            _id: "1",
            title: "Pothole on Main Street",
            description: "Large pothole causing damage to vehicles",
            category: "potholes",
            status: "pending",
            location: { lat: 40.7128, lng: -74.006 },
            address: "123 Main St, New York, NY",
            images: [],
            votes: 24,
            createdAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
            updatedAt: new Date(Date.now() - 604800000).toISOString()
          },
          {
            _id: "2",
            title: "Broken Streetlight",
            description: "Streetlight not working at the corner of Oak and Pine",
            category: "electricity",
            status: "in-progress",
            location: { lat: 40.7228, lng: -74.016 },
            address: "Oak & Pine St, New York, NY",
            images: [],
            votes: 15,
            createdAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
            updatedAt: new Date(Date.now() - 259200000).toISOString() // 3 days ago
          },
          {
            _id: "3",
            title: "Garbage Overflow",
            description: "Trash bins overflowing in the park",
            category: "garbage",
            status: "completed",
            location: { lat: 40.7028, lng: -74.026 },
            address: "Central Park, New York, NY",
            images: [],
            votes: 32,
            createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
            updatedAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          },
          {
            _id: "4",
            title: "Graffiti on Public Building",
            description: "Offensive graffiti on the side of the community center",
            category: "graffiti",
            status: "pending",
            location: { lat: 40.7328, lng: -74.036 },
            address: "456 Community Ave, New York, NY",
            images: [],
            votes: 8,
            createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            updatedAt: new Date(Date.now() - 172800000).toISOString()
          },
          {
            _id: "5",
            title: "Broken Sidewalk",
            description: "Sidewalk cracked and uneven, creating a tripping hazard",
            category: "sidewalks",
            status: "in-progress",
            location: { lat: 40.7428, lng: -74.046 },
            address: "789 Residential St, New York, NY",
            images: [],
            votes: 19,
            createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
            updatedAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
          }
        ]);
        return;
      }
      
      const data = await response.json();
      setComplaints(data.complaints);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      setError("An error occurred while loading complaints");
      // Use mock data for demo purposes
      setComplaints([
        {
          _id: "1",
          title: "Pothole on Main Street",
          description: "Large pothole causing damage to vehicles",
          category: "potholes",
          status: "pending",
          location: { lat: 40.7128, lng: -74.006 },
          address: "123 Main St, New York, NY",
          images: [],
          votes: 24,
          createdAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
          updatedAt: new Date(Date.now() - 604800000).toISOString()
        },
        {
          _id: "2",
          title: "Broken Streetlight",
          description: "Streetlight not working at the corner of Oak and Pine",
          category: "electricity",
          status: "in-progress",
          location: { lat: 40.7228, lng: -74.016 },
          address: "Oak & Pine St, New York, NY",
          images: [],
          votes: 15,
          createdAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
          updatedAt: new Date(Date.now() - 259200000).toISOString() // 3 days ago
        },
        {
          _id: "3",
          title: "Garbage Overflow",
          description: "Trash bins overflowing in the park",
          category: "garbage",
          status: "completed",
          location: { lat: 40.7028, lng: -74.026 },
          address: "Central Park, New York, NY",
          images: [],
          votes: 32,
          createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
          updatedAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
          _id: "4",
          title: "Graffiti on Public Building",
          description: "Offensive graffiti on the side of the community center",
          category: "graffiti",
          status: "pending",
          location: { lat: 40.7328, lng: -74.036 },
          address: "456 Community Ave, New York, NY",
          images: [],
          votes: 8,
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          updatedAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          _id: "5",
          title: "Broken Sidewalk",
          description: "Sidewalk cracked and uneven, creating a tripping hazard",
          category: "sidewalks",
          status: "in-progress",
          location: { lat: 40.7428, lng: -74.046 },
          address: "789 Residential St, New York, NY",
          images: [],
          votes: 19,
          createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          updatedAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams(searchParams);
    
    if (searchTerm) {
      queryParams.set("search", searchTerm);
    } else {
      queryParams.delete("search");
    }
    
    router.push(`/complaints?${queryParams.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const queryParams = new URLSearchParams(searchParams);
    
    if (value) {
      queryParams.set(key, value);
    } else {
      queryParams.delete(key);
    }
    
    router.push(`/complaints?${queryParams.toString()}`);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "potholes":
        return "bg-red-100 text-red-800";
      case "road-breaks":
        return "bg-orange-100 text-orange-800";
      case "sewer-issues":
        return "bg-yellow-100 text-yellow-800";
      case "water-supply":
        return "bg-blue-100 text-blue-800";
      case "electricity":
        return "bg-purple-100 text-purple-800";
      case "garbage":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Return the JSX content from your original component
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0 text-gray-900">Community Complaints</h1>
        <Link href="/map">
          <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700 border-none">View Map</Button>
        </Link>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="md:col-span-3">
          <form onSubmit={handleSearch} className="flex w-full max-w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </div>
        <div className="md:col-span-1">
          <div className="flex flex-col space-y-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Select
                value={filter.category}
                onValueChange={(value) => handleFilterChange("category", value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="potholes">Potholes</SelectItem>
                  <SelectItem value="road-breaks">Road Breaks</SelectItem>
                  <SelectItem value="sewer-issues">Sewer Issues</SelectItem>
                  <SelectItem value="water-supply">Water Supply</SelectItem>
                  <SelectItem value="electricity">Electricity</SelectItem>
                  <SelectItem value="garbage">Garbage</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={filter.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : complaints.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complaints.map((complaint) => (
            <Link key={complaint._id} href={`/complaints/${complaint._id}`}>
              <Card className="overflow-hidden h-full hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-0 flex flex-col h-full">
                  {complaint.images && complaint.images.length > 0 && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={complaint.images[0]}
                        alt={complaint.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        priority
                      />
                    </div>
                  )}
                  <div className="p-6 flex-grow">
                    <div className="flex justify-between mb-4">
                      <Badge className={getCategoryColor(complaint.category)}>
                        {complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1).replace(/-/g, ' ')}
                      </Badge>
                      <Badge className={getStatusColor(complaint.status)}>
                        {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1).replace(/-/g, ' ')}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">{complaint.title}</h3>
                    <p className="text-gray-600 line-clamp-2 text-sm mb-4">{complaint.description}</p>
                    
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="truncate">{complaint.address || "Unknown location"}</span>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 mt-auto">
                    <div className="flex justify-between">
                      <div className="flex items-center text-gray-500 text-sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        <span>{complaint.votes || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 text-center rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">No complaints found</h3>
          <p className="text-gray-600 mb-4">
            No complaints match your current filters or search criteria.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              router.push("/complaints");
              setSearchTerm("");
              setFilter({
                category: "all",
                status: "all"
              });
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

// Main page component with Suspense boundary
export default function ComplaintsPage() {
  return (
    <MainLayout>
      <Suspense fallback={
        <div className="container mx-auto py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading complaints...</p>
        </div>
      }>
        <ComplaintsList />
      </Suspense>
    </MainLayout>
  );
} 