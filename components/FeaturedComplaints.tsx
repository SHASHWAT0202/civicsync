'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

interface Complaint {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  location: {
    address?: string;
  };
  images: string[];
  votes: number;
  createdAt: string;
}

export default function FeaturedComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchComplaints() {
      try {
        setIsLoading(true);
        // Fetch public complaints with limit of 3
        const response = await fetch('/api/complaints?public=true&limit=3');
        
        if (!response.ok) {
          throw new Error('Failed to fetch complaints');
        }
        
        const data = await response.json();
        setComplaints(data.complaints);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching complaints:', err);
        setError('Unable to load complaints. Please try again later.');
        setIsLoading(false);
      }
    }

    fetchComplaints();
  }, []);

  // Get status class based on complaint status
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'In Progress';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-16 w-full mb-4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (complaints.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No complaints found. Be the first to report an issue in your community!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      {complaints.map((complaint) => (
        <div key={complaint._id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-48 bg-gray-200 relative">
            {complaint.images && complaint.images.length > 0 ? (
              <Image 
                src={complaint.images[0]} 
                alt={complaint.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <span>No Image Available</span>
              </div>
            )}
          </div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {complaint.category}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(complaint.status)}`}>
                {formatStatus(complaint.status)}
              </span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{complaint.title}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {complaint.description}
            </p>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-gray-500 text-sm">
                <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                {complaint.votes} votes
              </div>
              <Link href={`/dashboard/complaints/${complaint._id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View Details
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 