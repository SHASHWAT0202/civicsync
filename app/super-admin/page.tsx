"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { useUser } from '@clerk/nextjs';
import { differenceInDays, format, parseISO } from 'date-fns';
import ComplaintTimer from "@/components/ComplaintTimer";
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Complaint {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt: string;
  userName: string;
  userId: string;
  location: {
    address?: string;
  };
}

interface AdminUser {
  email: string;
  role: string;
}

interface ComplaintSummary {
  _id: string;
  title: string;
  status: string;
  category: string;
  createdAt: string;
  votes?: number;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    completedComplaints: 0,
    rejectedComplaints: 0,
    averageResolutionTime: 0
  });
  const [longPendingComplaints, setLongPendingComplaints] = useState<ComplaintSummary[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const checkAuthorization = () => {
      try {
        if (!isSignedIn || !user) {
          router.push('/sign-in');
          return;
        }

        const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'shashwat02022005@gmail.com';

        const isSuperAdmin = user.primaryEmailAddress?.emailAddress === superAdminEmail;

        if (!isSuperAdmin) {
          router.push('/');
          return;
        }

        setIsAuthorized(true);
        fetchComplaints();
        fetchAdmins();
        fetchLongPendingComplaints();
      } catch (error) {
        console.error('Authorization error:', error);
        router.push('/');
      }
    };

    checkAuthorization();
  }, [router, isSignedIn, user]);

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/complaints?admin=true');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Error ${response.status}: Failed to fetch complaints`);
      }
      
      const data = await response.json();
      
      // Check if data has the expected structure
      if (!data.complaints || !Array.isArray(data.complaints)) {
        console.error('Invalid response format:', data);
        setComplaints([]);
        setIsLoading(false);
        return;
      }
      
      setComplaints(data.complaints);
      
      // Calculate statistics
      const total = data.complaints.length;
      const pending = data.complaints.filter(c => c.status === 'pending').length;
      const inProgress = data.complaints.filter(c => c.status === 'in-progress').length;
      const completed = data.complaints.filter(c => c.status === 'completed').length;
      const rejected = data.complaints.filter(c => c.status === 'rejected').length;
      
      // Calculate average resolution time for completed complaints
      let totalResolutionDays = 0;
      const completedComplaints = data.complaints.filter(c => c.status === 'completed');
      
      completedComplaints.forEach(complaint => {
        const createdDate = parseISO(complaint.createdAt);
        const resolvedDate = parseISO(complaint.updatedAt);
        const days = differenceInDays(resolvedDate, createdDate);
        totalResolutionDays += days;
      });
      
      const averageTime = completedComplaints.length > 0 
        ? (totalResolutionDays / completedComplaints.length).toFixed(1) 
        : 0;
      
      setStats({
        totalComplaints: total,
        pendingComplaints: pending,
        inProgressComplaints: inProgress,
        completedComplaints: completed,
        rejectedComplaints: rejected,
        averageResolutionTime: parseFloat(averageTime.toString())
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setComplaints([]);
      setIsLoading(false);
    }
  };
  
  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch admin users');
      }
      
      const data = await response.json();
      setAdminUsers(data.adminUsers);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const fetchLongPendingComplaints = async () => {
    try {
      const response = await fetch('/api/complaints?admin=true');
      if (!response.ok) throw new Error('Failed to fetch complaints');
      const data = await response.json();
      
      // Filter long-pending complaints (more than 7 days)
      const longPending = data.complaints.filter((complaint: any) => {
        const created = new Date(complaint.createdAt);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return diffInDays >= 7 && complaint.status !== 'completed';
      });

      setLongPendingComplaints(longPending.map((complaint: any) => ({
        _id: complaint._id,
        title: complaint.title,
        status: complaint.status,
        category: complaint.category,
        createdAt: complaint.createdAt,
        votes: complaint.votes || 0
      })));
    } catch (error) {
      console.error('Error fetching long-pending complaints:', error);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAdminEmail || !newAdminEmail.includes('@')) {
      setMessage('Please enter a valid email address');
      return;
    }
    
    try {
      const response = await fetch('/api/admin/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newAdminEmail }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setMessage(data.error || 'Failed to add admin');
        return;
      }
      
      setMessage(`Added ${newAdminEmail} as admin successfully`);
      setNewAdminEmail('');
      fetchAdmins();
    } catch (error) {
      console.error('Error adding admin:', error);
      setMessage('An error occurred while adding admin');
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!confirm(`Are you sure you want to remove admin privileges from ${email}?`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/admin/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setMessage(data.error || 'Failed to remove admin');
        return;
      }
      
      setMessage(`Removed admin privileges from ${email}`);
      fetchAdmins();
    } catch (error) {
      console.error('Error removing admin:', error);
      setMessage('An error occurred while removing admin');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">Pending</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-500 text-white hover:bg-blue-600">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-500 text-white hover:bg-green-600">Completed</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 text-white hover:bg-red-600">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Add category filter options
  const categories = ["Infrastructure", "Sanitation", "Public Safety", "Environment", "Transportation", "Other"];
  
  // Add status filter options
  const statuses = ["pending", "in-progress", "completed", "rejected"];
  
  // Filter complaints based on selected category and status
  const filteredComplaints = complaints.filter(complaint => {
    const matchesCategory = categoryFilter === "all" || complaint.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    return matchesCategory && matchesStatus;
  });

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Super Admin Portal</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Complaint Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.totalComplaints}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <p className="text-sm font-medium text-yellow-700">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingComplaints}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm font-medium text-blue-700">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgressComplaints}</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm font-medium text-green-700">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedComplaints}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Resolution Time</h2>
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm font-medium text-blue-700">Average Days to Resolution</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.averageResolutionTime} {stats.averageResolutionTime === 1 ? 'day' : 'days'}
              </p>
            </div>
            <p className="text-sm font-medium text-gray-600 mt-3">
              Based on {stats.completedComplaints} completed complaints
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Rejection Rate</h2>
            <div className="bg-red-50 p-4 rounded">
              <p className="text-sm font-medium text-red-700">Rejected Complaints</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejectedComplaints}</p>
            </div>
            <p className="text-sm font-medium text-gray-600 mt-3">
              {stats.totalComplaints > 0 
                ? `${((stats.rejectedComplaints / stats.totalComplaints) * 100).toFixed(1)}% of all complaints` 
                : 'No complaints yet'}
            </p>
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Filter Complaints</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category-filter" className="block text-sm font-bold text-gray-700 mb-2">
                Category
              </label>
              <Select 
                value={categoryFilter} 
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger id="category-filter" className="w-full text-gray-900 bg-white border-gray-300 font-medium">
                  <SelectValue placeholder="All Categories" className="text-gray-900" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all" className="text-gray-900 font-medium">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category} className="text-gray-900 font-medium">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="status-filter" className="block text-sm font-bold text-gray-700 mb-2">
                Status
              </label>
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status-filter" className="w-full text-gray-900 bg-white border-gray-300 font-medium">
                  <SelectValue placeholder="All Statuses" className="text-gray-900" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all" className="text-gray-900 font-medium">All Statuses</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status} className="text-gray-900 font-medium">
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Admin Management */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Management</h2>
          
          <form onSubmit={handleAddAdmin} className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Add New Admin</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-white placeholder-gray-500 font-medium shadow-sm"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-base shadow-sm transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add New Admin
              </button>
            </div>
            {message && (
              <p className={`mt-4 p-3 rounded text-base font-medium ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-300' : 'bg-red-50 text-red-700 border border-red-300'}`}>
                {message}
              </p>
            )}
          </form>
          
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Current Admins</h3>
            {adminUsers.length > 0 ? (
              <ul className="divide-y border rounded-lg overflow-hidden">
                {adminUsers.map((admin) => (
                  <li key={admin.email} className="py-4 px-4 flex justify-between items-center hover:bg-gray-50 bg-white">
                    <div>
                      <p className="font-bold text-lg text-gray-900">{admin.email}</p>
                      <p className={`text-sm font-bold px-2 py-1 inline-block rounded ${admin.role === 'super-admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {admin.role === 'super-admin' ? 'Super Admin' : admin.role}
                      </p>
                    </div>
                    {admin.role !== 'super-admin' && (
                      <button
                        onClick={() => handleRemoveAdmin(admin.email)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 font-bold text-sm border border-red-200"
                      >
                        Remove
                      </button>
                    )}
                    {admin.role === 'super-admin' && (
                      <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md cursor-not-allowed font-bold text-sm border border-gray-300">
                        Cannot Remove
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700 py-4 px-4 bg-gray-50 rounded-lg border border-gray-200">No admin users found</p>
            )}
          </div>
        </div>
        
        {/* Recent Complaints Table */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Complaints</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredComplaints.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Reported By
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Reported
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Days Open
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredComplaints.slice(0, 10).map((complaint) => {
                    const createdDate = parseISO(complaint.createdAt);
                    const currentDate = new Date();
                    const daysOpen = differenceInDays(currentDate, createdDate);
                    
                    let statusClass = '';
                    switch (complaint.status) {
                      case 'pending':
                        statusClass = 'bg-yellow-100 text-yellow-800';
                        break;
                      case 'in-progress':
                        statusClass = 'bg-blue-100 text-blue-800';
                        break;
                      case 'completed':
                        statusClass = 'bg-green-100 text-green-800';
                        break;
                      case 'rejected':
                        statusClass = 'bg-red-100 text-red-800';
                        break;
                    }
                    
                    return (
                      <tr key={complaint._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {complaint.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${statusClass}`}>
                            {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1).replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                          {complaint.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                          {format(createdDate, 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {complaint.status === 'completed' || complaint.status === 'rejected' ? (
                            <span className="text-gray-700">
                              {differenceInDays(parseISO(complaint.updatedAt), createdDate)} days
                            </span>
                          ) : (
                            <span className={daysOpen > 30 ? 'text-red-600 font-bold' : 'text-gray-700'}>
                              {daysOpen} days
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <a
                            href={`/admin/complaints/${complaint._id}`}
                            className="text-blue-600 hover:text-blue-900 font-bold"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-700 py-6 text-center font-medium">No complaints found</p>
          )}
        </div>
        
        {/* Add a section for long-pending complaints */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Long-Pending Complaints</h2>
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {longPendingComplaints.map((complaint) => (
                    <tr key={complaint._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-800">{complaint.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(complaint.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ComplaintTimer 
                          createdAt={complaint.createdAt} 
                          complaintId={complaint._id}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/admin/complaints/${complaint._id}`} className="text-blue-600 hover:text-blue-800 font-bold">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 