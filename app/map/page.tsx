"use client";

import { useState, useEffect, useRef } from "react";
import MainLayout from "@/components/MainLayout";
import { ComplaintCategory, ComplaintStatus } from "@/types";
import Link from "next/link";

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
  createdAt: string;
  updatedAt: string;
}

export default function MapPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [filter, setFilter] = useState({
    category: "",
    status: "",
  });
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMapsScript = () => {
      const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!googleMapsApiKey) {
        console.error("Google Maps API key is missing");
        return;
      }
      
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
      };
    };
    
    if (typeof window !== "undefined" && !window.google?.maps) {
      loadGoogleMapsScript();
    } else if (window.google?.maps) {
      initializeMap();
    }
  }, []);

  useEffect(() => {
    if (mapRef.current && complaints.length > 0) {
      updateMapMarkers();
    }
  }, [complaints]);

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
      
      // Get all complaints for the map view
      queryParams.append("limit", "1000");
      
      // Add a public flag to indicate this is a public request
      queryParams.append("public", "true");
      
      const response = await fetch(`/api/complaints?${queryParams.toString()}`);
      
      if (!response.ok) {
        // If the API returns an error, use mock data for demo purposes
        setComplaints([
          {
            _id: "1",
            title: "Pothole on Main Street",
            description: "Large pothole causing damage to vehicles",
            category: "potholes",
            status: "pending",
            location: { lat: 40.7128, lng: -74.006 },
            images: [],
            votes: 24,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: "2",
            title: "Broken Streetlight",
            description: "Streetlight not working at the corner of Oak and Pine",
            category: "electricity",
            status: "in-progress",
            location: { lat: 40.7228, lng: -74.016 },
            images: [],
            votes: 15,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: "3",
            title: "Garbage Overflow",
            description: "Trash bins overflowing in the park",
            category: "garbage",
            status: "completed",
            location: { lat: 40.7028, lng: -74.026 },
            images: [],
            votes: 32,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
        return;
      }
      
      const data = await response.json();
      setComplaints(data.complaints);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      // Use mock data in case of error
      setComplaints([
        {
          _id: "1",
          title: "Pothole on Main Street",
          description: "Large pothole causing damage to vehicles",
          category: "potholes",
          status: "pending",
          location: { lat: 40.7128, lng: -74.006 },
          images: [],
          votes: 24,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: "2",
          title: "Broken Streetlight",
          description: "Streetlight not working at the corner of Oak and Pine",
          category: "electricity",
          status: "in-progress",
          location: { lat: 40.7228, lng: -74.016 },
          images: [],
          votes: 15,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: "3",
          title: "Garbage Overflow",
          description: "Trash bins overflowing in the park",
          category: "garbage",
          status: "completed",
          location: { lat: 40.7028, lng: -74.026 },
          images: [],
          votes: 32,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapContainerRef.current || !window.google?.maps) return;
    
    // Default center (can be set to user's location or a city center)
    const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // New York City
    
    const mapOptions: google.maps.MapOptions = {
      center: defaultCenter,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    };
    
    mapRef.current = new google.maps.Map(mapContainerRef.current, mapOptions);
    
    // If we already have complaints, add markers
    if (complaints.length > 0) {
      updateMapMarkers();
    }
  };

  const updateMapMarkers = () => {
    if (!mapRef.current || !window.google?.maps) return;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    
    // Create bounds to fit all markers
    const bounds = new google.maps.LatLngBounds();
    
    // Add markers for each complaint
    complaints.forEach(complaint => {
      if (!complaint.location) return;
      
      const position = {
        lat: complaint.location.lat,
        lng: complaint.location.lng
      };
      
      // Skip invalid coordinates
      if (isNaN(position.lat) || isNaN(position.lng)) return;
      
      // Determine marker color based on status
      let markerIcon = "";
      switch (complaint.status) {
        case "pending":
          markerIcon = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
          break;
        case "in-progress":
          markerIcon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
          break;
        case "completed":
          markerIcon = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
          break;
        case "rejected":
          markerIcon = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          break;
        default:
          markerIcon = "http://maps.google.com/mapfiles/ms/icons/purple-dot.png";
      }
      
      const marker = new google.maps.Marker({
        position,
        map: mapRef.current,
        title: complaint.title,
        icon: markerIcon,
        animation: google.maps.Animation.DROP,
      });
      
      // Add click event to marker
      marker.addListener("click", () => {
        setSelectedComplaint(complaint);
      });
      
      markersRef.current.push(marker);
      bounds.extend(position);
    });
    
    // Fit map to bounds if we have markers
    if (markersRef.current.length > 0) {
      mapRef.current.fitBounds(bounds);
      
      // Don't zoom in too far
      const listener = google.maps.event.addListener(mapRef.current, "idle", () => {
        if (mapRef.current!.getZoom()! > 16) {
          mapRef.current!.setZoom(16);
        }
        google.maps.event.removeListener(listener);
      });
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const closeInfoWindow = () => {
    setSelectedComplaint(null);
  };

  const getCategoryIcon = (category: ComplaintCategory) => {
    switch (category) {
      case "potholes":
        return "🛣️";
      case "road-breaks":
        return "🚧";
      case "sewer-issues":
        return "🚿";
      case "water-supply":
        return "💧";
      case "electricity":
        return "⚡";
      case "garbage":
        return "🗑️";
      default:
        return "📌";
    }
  };

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
          <h1 className="text-3xl font-bold">Complaint Map</h1>
          <p className="mt-2 text-blue-100">
            View all reported civic issues on an interactive map
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold text-gray-900">Map View</h2>
            <p className="text-gray-600">
              {complaints.length} complaints displayed
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={filter.category}
                onChange={handleFilterChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="potholes">Potholes</option>
                <option value="road-breaks">Road Breaks</option>
                <option value="sewer-issues">Sewer Issues</option>
                <option value="water-supply">Water Supply</option>
                <option value="electricity">Electricity</option>
                <option value="garbage">Garbage</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filter.status}
                onChange={handleFilterChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            <div 
              ref={mapContainerRef} 
              className="w-full h-[600px]"
            ></div>
            
            {selectedComplaint && (
              <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-lg p-4 z-20">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">{selectedComplaint.title}</h3>
                  <button 
                    onClick={closeInfoWindow}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-2">
                  <div className="flex items-center">
                    <span className="mr-2">{getCategoryIcon(selectedComplaint.category)}</span>
                    <span className="text-sm text-gray-500">{selectedComplaint.category.replace("-", " ")}</span>
                    <span className={`ml-auto px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[selectedComplaint.status]}`}>
                      {selectedComplaint.status.replace("-", " ")}
                    </span>
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-500 line-clamp-3">{selectedComplaint.description}</p>
                  
                  <div className="mt-3 flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    {selectedComplaint.votes} votes
                  </div>
                  
                  {selectedComplaint.location?.address && (
                    <div className="mt-2 text-sm text-gray-500">
                      <svg className="inline-block mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {selectedComplaint.location.address}
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Link
                      href={`/complaints/${selectedComplaint._id}`}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-yellow-400 mr-2"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm text-gray-600">Rejected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 