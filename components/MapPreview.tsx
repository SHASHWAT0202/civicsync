'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Complaint {
  _id: string;
  title: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
}

export default function MapPreview() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch a few complaints for the map preview
    const fetchComplaints = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/complaints?public=true&limit=10');
        
        if (!response.ok) {
          throw new Error('Failed to fetch complaints');
        }
        
        const data = await response.json();
        setComplaints(data.complaints);
      } catch (error) {
        console.error('Error fetching complaints for map preview:', error);
        // Use mock data in case of error
        setComplaints([
          {
            _id: "1",
            title: "Pothole on Main Street",
            status: "pending",
            location: { lat: 40.7128, lng: -74.006 }
          },
          {
            _id: "2",
            title: "Broken Streetlight",
            status: "in-progress",
            location: { lat: 40.7228, lng: -74.016 }
          },
          {
            _id: "3",
            title: "Garbage Overflow",
            status: "completed",
            location: { lat: 40.7028, lng: -74.026 }
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMapsScript = () => {
      const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!googleMapsApiKey) {
        console.error("Google Maps API key is missing");
        return;
      }
      
      // Check if the script is already being loaded by looking for an existing script tag
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (existingScript) {
        // If script is already loading or loaded, wait for it to be ready
        if (window.google?.maps) {
          initializeMap();
        } else {
          existingScript.addEventListener('load', initializeMap);
        }
        return;
      }
      
      // Only create a new script tag if one doesn't already exist
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.id = "google-maps-script";
      script.onload = initializeMap;
      document.head.appendChild(script);
      
      return () => {
        // Clean up only if we added this script
        const scriptToRemove = document.getElementById("google-maps-script");
        if (scriptToRemove && scriptToRemove === script) {
          document.head.removeChild(scriptToRemove);
        }
      };
    };
    
    if (typeof window !== "undefined") {
      if (window.google?.maps) {
        initializeMap();
      } else {
        loadGoogleMapsScript();
      }
    }
  }, []);

  useEffect(() => {
    if (mapRef.current && complaints.length > 0) {
      updateMapMarkers();
    }
  }, [complaints]);

  const initializeMap = () => {
    if (!mapContainerRef.current || !window.google?.maps) return;
    
    // Default center (New York City)
    const defaultCenter = { lat: 40.7128, lng: -74.0060 };
    
    const mapOptions: google.maps.MapOptions = {
      center: defaultCenter,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
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
      
      markersRef.current.push(marker);
      bounds.extend(position);
    });
    
    // Fit map to bounds if we have markers
    if (markersRef.current.length > 0) {
      mapRef.current.fitBounds(bounds);
      
      // Don't zoom in too far
      const listener = google.maps.event.addListener(mapRef.current, "idle", () => {
        if (mapRef.current!.getZoom()! > 14) {
          mapRef.current!.setZoom(14);
        }
        google.maps.event.removeListener(listener);
      });
    }
  };

  return (
    <div className="relative rounded-md overflow-hidden h-full">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      <div ref={mapContainerRef} className="w-full h-full" />
      
      <div className="absolute bottom-3 right-3">
        <Link 
          href="/map" 
          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-white shadow-md hover:bg-gray-50"
        >
          <span>Expand Map</span>
          <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
} 