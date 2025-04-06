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
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [filter, setFilter] = useState({
    category: searchParams.get("category") || "all",
    status: searchParams.get("status") || "all",
  });

  useEffect(() => {
    fetchComplaints();
  }, [filter, searchParams]);

  useEffect(() => {
    setFilter({
      category: searchParams.get("category") || "all",
      status: searchParams.get("status") || "all",
    });
    setSearchTerm(searchParams.get("search") || "");
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
      
      const search = searchParams.get("search");
      if (search) {
        queryParams.append("search", search);
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
    const queryParams = new URLSearchParams(searchParams.toString());
    
    if (searchTerm) {
      queryParams.set("search", searchTerm);
    } else {
      queryParams.delete("search");
    }
    
    router.push(`/complaints?${queryParams.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const queryParams = new URLSearchParams(searchParams.toString());
    
    if (value && value !== "all") {
      queryParams.set(key, value);
    } else {
      queryParams.delete(key);
    }
    
    router.push(`/complaints?${queryParams.toString()}`);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "potholes":
        return "bg-red-200 text-red-800 font-medium";
      case "road-breaks":
        return "bg-orange-200 text-orange-800 font-medium";
      case "sewer-issues":
        return "bg-yellow-200 text-yellow-800 font-medium";
      case "water-supply":
        return "bg-blue-200 text-blue-800 font-medium";
      case "electricity":
        return "bg-purple-200 text-purple-800 font-medium";
      case "garbage":
        return "bg-green-200 text-green-800 font-medium";
      default:
        return "bg-gray-200 text-gray-800 font-medium";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-200 text-yellow-800 font-medium";
      case "in-progress":
        return "bg-blue-200 text-blue-800 font-medium";
      case "completed":
        return "bg-green-200 text-green-800 font-medium";
      case "rejected":
        return "bg-red-200 text-red-800 font-medium";
      default:
        return "bg-gray-200 text-gray-800 font-medium";
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

      <div className="bg-white p-6 shadow-md rounded-lg mb-8 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <form onSubmit={handleSearch} className="flex w-full max-w-full items-center space-x-2">
              <Input
                type="text"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow py-6 text-base border-gray-300 bg-white text-black"
              />
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 py-6 px-6 text-base font-medium min-w-[120px]">
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </form>
          </div>
          <div className="md:col-span-1">
            <div className="flex flex-col space-y-4">
              <div>
                <label htmlFor="category" className="block text-sm font-bold text-gray-800 mb-1">
                  Category
                </label>
                <Select
                  value={filter.category}
                  onValueChange={(value) => handleFilterChange("category", value)}
                >
                  <SelectTrigger id="category" className="py-6 text-base border-gray-300 bg-white text-black">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 shadow-md z-50">
                    <SelectItem value="all" className="py-3 text-base text-black font-medium">All Categories</SelectItem>
                    <SelectItem value="potholes" className="py-3 text-base text-black">Potholes</SelectItem>
                    <SelectItem value="road-breaks" className="py-3 text-base text-black">Road Breaks</SelectItem>
                    <SelectItem value="sewer-issues" className="py-3 text-base text-black">Sewer Issues</SelectItem>
                    <SelectItem value="water-supply" className="py-3 text-base text-black">Water Supply</SelectItem>
                    <SelectItem value="electricity" className="py-3 text-base text-black">Electricity</SelectItem>
                    <SelectItem value="garbage" className="py-3 text-base text-black">Garbage</SelectItem>
                    <SelectItem value="other" className="py-3 text-base text-black">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-bold text-gray-800 mb-1">
                  Status
                </label>
                <Select
                  value={filter.status}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger id="status" className="py-6 text-base border-gray-300 bg-white text-black">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 shadow-md z-50">
                    <SelectItem value="all" className="py-3 text-base text-black font-medium">All Statuses</SelectItem>
                    <SelectItem value="pending" className="py-3 text-base text-black">Pending</SelectItem>
                    <SelectItem value="in-progress" className="py-3 text-base text-black">In Progress</SelectItem>
                    <SelectItem value="completed" className="py-3 text-base text-black">Completed</SelectItem>
                    <SelectItem value="rejected" className="py-3 text-base text-black">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {searchParams.get("search") && (
        <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-lg shadow-sm">
          <p className="text-blue-800 font-medium flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search results for: <span className="font-bold ml-2 text-blue-900">{searchParams.get("search")}</span>
            <Button 
              variant="link" 
              className="ml-4 text-blue-600 font-medium" 
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete("search");
                router.push(`/complaints?${params.toString()}`);
              }}
            >
              Clear search
            </Button>
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="overflow-hidden shadow-md">
              <CardContent className="p-0">
                <div className="h-48 bg-gray-200 animate-pulse"></div>
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
              <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow duration-300 border border-gray-200">
                <CardContent className="p-0 flex flex-col h-full">
                  {complaint.images && complaint.images.length > 0 ? (
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
                  ) : (
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-500">No image available</p>
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
                    <h3 className="text-xl font-bold mb-2 text-gray-900">{complaint.title}</h3>
                    <p className="text-gray-700 line-clamp-2 text-sm mb-4">{complaint.description}</p>
                    
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="truncate font-medium">{complaint.address || "Unknown location"}</span>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 mt-auto">
                    <div className="flex justify-between">
                      <div className="flex items-center text-gray-600 text-sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="font-medium">{formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}</span>
                      </div>
                      <div className="flex items-center text-gray-600 text-sm">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        <span className="font-medium">{complaint.votes || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 text-center rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-bold mb-2">No complaints found</h3>
          <p className="text-gray-700 mb-4">
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
            className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 text-base"
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