"use client";

import { useState, useEffect } from "react";
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

export default function ComplaintsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState({
    category: searchParams.get("category") || "",
    status: searchParams.get("status") || "",
  });

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  useEffect(() => {
    setFilter({
      category: searchParams.get("category") || "",
      status: searchParams.get("status") || "",
    });
  }, [searchParams]);

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filter.category) {
        queryParams.append("category", filter.category);
      }
      
      if (filter.status) {
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
    // Client-side filtering for search
    // In a real app, you might want to send this to the API
  };

  const handleFilterChange = (key: string, value: string) => {
    // If "all" is selected, treat it as empty string for the filter
    const filterValue = value === "all" ? "" : value;
    
    setFilter(prev => ({ ...prev, [key]: filterValue }));
    
    // Update URL query params
    const params = new URLSearchParams(searchParams.toString());
    if (filterValue) {
      params.set(key, filterValue);
    } else {
      params.delete(key);
    }
    
    router.push(`/complaints?${params.toString()}`);
  };

  const filteredComplaints = complaints.filter(complaint => 
    complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                className="flex-1 text-gray-900 placeholder:text-gray-500 border-gray-300"
              />
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select
                value={filter.category}
                onValueChange={(value) => handleFilterChange("category", value)}
              >
                <SelectTrigger className="bg-blue-600 text-white hover:bg-blue-700 border-none">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all" className="text-gray-900">All Categories</SelectItem>
                  <SelectItem value="potholes" className="text-gray-900">Potholes</SelectItem>
                  <SelectItem value="streetlights" className="text-gray-900">Streetlights</SelectItem>
                  <SelectItem value="garbage" className="text-gray-900">Garbage</SelectItem>
                  <SelectItem value="graffiti" className="text-gray-900">Graffiti</SelectItem>
                  <SelectItem value="sidewalks" className="text-gray-900">Sidewalks</SelectItem>
                  <SelectItem value="noise" className="text-gray-900">Noise</SelectItem>
                  <SelectItem value="water" className="text-gray-900">Water</SelectItem>
                  <SelectItem value="electricity" className="text-gray-900">Electricity</SelectItem>
                  <SelectItem value="other" className="text-gray-900">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={filter.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger className="bg-blue-600 text-white hover:bg-blue-700 border-none">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all" className="text-gray-900">All Statuses</SelectItem>
                  <SelectItem value="pending" className="text-gray-900">Pending</SelectItem>
                  <SelectItem value="in-progress" className="text-gray-900">In Progress</SelectItem>
                  <SelectItem value="completed" className="text-gray-900">Completed</SelectItem>
                  <SelectItem value="rejected" className="text-gray-900">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-gray-200">
                  <Skeleton className="h-full w-full" />
                </div>
                <CardContent className="pt-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-5 w-1/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-gray-900">No Complaints Found</h2>
            <p className="text-gray-700 mb-6">
              No complaints match your current filters or search terms.
            </p>
            <Button onClick={() => {
              setSearchTerm("");
              setFilter({ category: "", status: "" });
              router.push("/complaints");
            }} className="bg-blue-600 text-white hover:bg-blue-700">
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComplaints.map((complaint) => (
              <Card key={complaint._id} className="overflow-hidden flex flex-col">
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  {complaint.images && complaint.images.length > 0 ? (
                    <img 
                      src={complaint.images[0]} 
                      alt={complaint.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <p className="text-gray-700">No image available</p>
                  )}
                </div>
                <CardContent className="pt-6 flex-1">
                  <h2 className="text-xl font-bold mb-1 line-clamp-1 text-gray-900">{complaint.title}</h2>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={getCategoryColor(complaint.category)}>
                      {complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)}
                    </Badge>
                    <Badge className={getStatusColor(complaint.status)}>
                      {complaint.status === "in-progress" 
                        ? "In Progress" 
                        : complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-gray-800 mb-4 line-clamp-3">{complaint.description}</p>
                  <div className="flex items-center text-sm text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="truncate">{complaint.address || "Location not specified"}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Reported {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center pt-0 pb-4">
                  <div className="flex items-center">
                    <ThumbsUp className="h-4 w-4 mr-1 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900">{complaint.votes} supports</span>
                  </div>
                  <Button asChild variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700 border-none">
                    <Link href={`/complaints/${complaint._id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 