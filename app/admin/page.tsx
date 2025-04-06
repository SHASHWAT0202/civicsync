"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  AlertCircle, Users, FileText, CheckCircle, XCircle, Clock, Search, 
  Settings, Shield, Bell, User, LogOut, Home, Layout,
  TrendingUp, BarChart2, Activity, Calendar, Filter, RefreshCcw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";
import ComplaintTimer from "@/components/ComplaintTimer";

interface ComplaintSummary {
  _id: string;
  title: string;
  status: string;
  category: string;
  createdAt: string;
  votes: number;
}

export default function AdminDashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    completedComplaints: 0,
    rejectedComplaints: 0,
    totalUsers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [recentComplaints, setRecentComplaints] = useState<ComplaintSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (isLoaded) {
        if (!isSignedIn) {
          router.push("/sign-in");
          return;
        }
        
        const userEmail = user?.primaryEmailAddress?.emailAddress;
        if (!userEmail) {
          router.push("/dashboard");
          return;
        }
        
        // Check if user is superadmin
        const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "shashwat02022005@gmail.com";
        if (userEmail === superAdminEmail) {
          setIsAuthorized(true);
          fetchData();
          return;
        }
        
        // Check if user has admin role
        try {
          const response = await fetch('/api/users/role?email=' + encodeURIComponent(userEmail));
          if (response.ok) {
            const data = await response.json();
            if (data.role === 'admin') {
              setIsAuthorized(true);
              fetchData();
              return;
            }
          }
          router.push("/dashboard");
        } catch (error) {
          console.error("Error checking user role:", error);
          router.push("/dashboard");
        }
      }
    };
    
    checkAuth();
  }, [isLoaded, isSignedIn, user, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch complaints from API
      const complaintsResponse = await fetch('/api/complaints?admin=true');
      
      if (!complaintsResponse.ok) {
        throw new Error('Failed to fetch complaints');
      }
      
      const complaintsData = await complaintsResponse.json();
      
      // Set the real complaints from API
      setRecentComplaints(complaintsData.complaints.map((complaint: any) => ({
        _id: complaint._id,
        title: complaint.title,
        status: complaint.status,
        category: complaint.category,
        createdAt: complaint.createdAt,
        votes: complaint.votes || 0
      })));
      
      // Calculate stats based on actual data
      const totalComplaints = complaintsData.complaints.length;
      const pendingComplaints = complaintsData.complaints.filter((c: any) => c.status === 'pending').length;
      const inProgressComplaints = complaintsData.complaints.filter((c: any) => c.status === 'in-progress').length;
      const completedComplaints = complaintsData.complaints.filter((c: any) => c.status === 'completed').length;
      const rejectedComplaints = complaintsData.complaints.filter((c: any) => c.status === 'rejected').length;
      
      // Fetch user count from API 
      const usersResponse = await fetch('/api/users/count');
      const usersData = await usersResponse.json();
      
      setStats({
        totalComplaints,
        pendingComplaints,
        inProgressComplaints,
        completedComplaints,
        rejectedComplaints,
        totalUsers: usersData.count || 0
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
      
      // Fallback to empty arrays if API fails
      setRecentComplaints([]);
      setStats({
        totalComplaints: 0,
        pendingComplaints: 0,
        inProgressComplaints: 0,
        completedComplaints: 0,
        rejectedComplaints: 0,
        totalUsers: 0
      });
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData().then(() => {
      setTimeout(() => setRefreshing(false), 1000);
    });
  };

  const filteredComplaints = recentComplaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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

  // Add a new function to handle status updates
  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    try {
      // Show a toast notification for the pending update
      const toastId = toast.loading(`Updating status to ${newStatus}...`);
      
      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }
      
      // Update the local state to reflect the changes
      setRecentComplaints(prevComplaints => 
        prevComplaints.map(complaint => 
          complaint._id === complaintId ? { ...complaint, status: newStatus } : complaint
        )
      );
      
      // Update the success toast
      toast.success(`Status updated to ${newStatus}`, { id: toastId });
      
      // Refresh data after a short delay
      setTimeout(() => {
        fetchData();
      }, 1000);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const handleLongDuration = async (complaintId: string, duration: number) => {
    try {
      const response = await fetch('/api/admin/report-long-complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ complaintId, duration }),
      });

      if (!response.ok) {
        throw new Error('Failed to report long-pending complaint');
      }

      toast.success('Long-pending complaint reported to super admin');
    } catch (error) {
      console.error('Error reporting long-pending complaint:', error);
      toast.error('Failed to report long-pending complaint');
    }
  };

  if (!isLoaded || !isSignedIn || !isAuthorized) {
    return (
      <div className="fixed inset-0 bg-zinc-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          <p className="mt-4 text-white text-lg">Authenticating Admin Access...</p>
        </div>
      </div>
    );
  }

  const progressValue = (stats.completedComplaints / stats.totalComplaints) * 100;

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Admin Navigation Sidebar */}
      <div className="flex">
        <aside className="fixed left-0 top-0 h-screen w-16 md:w-64 bg-zinc-800 border-r border-zinc-700 z-10">
          <div className="flex h-16 items-center justify-center md:justify-start px-4 border-b border-zinc-700">
            <Shield className="h-6 w-6 text-purple-500" />
            <span className="ml-2 font-bold text-lg hidden md:block">Admin Portal</span>
          </div>
          
          <nav className="p-2 md:p-4 space-y-1">
            <div className="flex items-center px-2 py-3 text-sm rounded-md bg-zinc-700 text-white">
              <Layout className="h-5 w-5 mr-2" />
              <span className="hidden md:block">Dashboard</span>
            </div>
            
            <Link href="/admin/complaints" className="flex items-center px-2 py-3 text-sm rounded-md hover:bg-zinc-700 text-zinc-300 hover:text-white">
              <FileText className="h-5 w-5 mr-2" />
              <span className="hidden md:block">Complaints</span>
            </Link>
            
            <Link href="/admin/users" className="flex items-center px-2 py-3 text-sm rounded-md hover:bg-zinc-700 text-zinc-300 hover:text-white">
              <Users className="h-5 w-5 mr-2" />
              <span className="hidden md:block">Users</span>
            </Link>
            
            <Link href="/admin/analytics" className="flex items-center px-2 py-3 text-sm rounded-md hover:bg-zinc-700 text-zinc-300 hover:text-white">
              <BarChart2 className="h-5 w-5 mr-2" />
              <span className="hidden md:block">Analytics</span>
            </Link>
            
            <Link href="/admin/settings" className="flex items-center px-2 py-3 text-sm rounded-md hover:bg-zinc-700 text-zinc-300 hover:text-white">
              <Settings className="h-5 w-5 mr-2" />
              <span className="hidden md:block">Settings</span>
            </Link>
            
            <div className="pt-4 mt-4 border-t border-zinc-700">
              <Link href="/" className="flex items-center px-2 py-3 text-sm rounded-md hover:bg-zinc-700 text-zinc-300 hover:text-white">
                <Home className="h-5 w-5 mr-2" />
                <span className="hidden md:block">Back to Site</span>
              </Link>
              
              <button className="w-full mt-2 flex items-center px-2 py-3 text-sm rounded-md hover:bg-zinc-700 text-zinc-300 hover:text-white">
                <LogOut className="h-5 w-5 mr-2" />
                <span className="hidden md:block">Sign Out</span>
              </button>
            </div>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="pl-16 md:pl-64 w-full">
          {/* Top Bar */}
          <div className="h-16 border-b border-zinc-700 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center">
              <button 
                onClick={handleRefresh}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-zinc-800"
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <span className="ml-4 text-sm text-zinc-400">Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
              </button>
              
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="ml-2 hidden md:block">Admin</span>
              </div>
            </div>
          </div>
          
          {/* Dashboard Content */}
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-zinc-400">Welcome back, {user?.firstName}. Here's what's happening today.</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-2">
                <Select defaultValue="today">
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white w-[150px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Activity className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-zinc-800 border-zinc-700 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Total Complaints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalComplaints}</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">+12% from last month</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-800 border-zinc-700 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoading ? "..." : stats.pendingComplaints}</div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((stats.pendingComplaints / stats.totalComplaints) * 100)}%</span>
                    </div>
                    <Progress 
                      value={stats.pendingComplaints / stats.totalComplaints * 100} 
                      className="h-2 bg-zinc-700" 
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-800 border-zinc-700 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">In Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoading ? "..." : stats.inProgressComplaints}</div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((stats.inProgressComplaints / stats.totalComplaints) * 100)}%</span>
                    </div>
                    <Progress 
                      value={stats.inProgressComplaints / stats.totalComplaints * 100} 
                      className="h-2 bg-zinc-700" 
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-800 border-zinc-700 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoading ? "..." : stats.completedComplaints}</div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((stats.completedComplaints / stats.totalComplaints) * 100)}%</span>
                    </div>
                    <Progress 
                      value={stats.completedComplaints / stats.totalComplaints * 100} 
                      className="h-2 bg-zinc-700" 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Overall Progress Card */}
            <div className="mb-6">
              <Card className="bg-zinc-800 border-zinc-700 text-white">
                <CardHeader>
                  <CardTitle>Overall Platform Progress</CardTitle>
                  <CardDescription className="text-zinc-400">Resolution rate of all issues reported this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                        <span className="text-lg font-bold">{Math.round(progressValue)}%</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium">Resolution Rate</div>
                        <div className="text-xs text-zinc-400">Goal: 75%</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <div className="text-xs text-zinc-400">Users</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.totalComplaints}</div>
                        <div className="text-xs text-zinc-400">Complaints</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.completedComplaints}</div>
                        <div className="text-xs text-zinc-400">Resolved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.rejectedComplaints}</div>
                        <div className="text-xs text-zinc-400">Rejected</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{Math.round(progressValue)}%</span>
                      </div>
                      <Progress 
                        value={progressValue} 
                        className="h-2 bg-zinc-700"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Tabs Content */}
            <Tabs defaultValue="recent" className="mb-6">
              <div className="mb-2">
                <TabsList className="bg-zinc-800 text-zinc-400">
                  <TabsTrigger value="recent" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                    Recent Complaints
                  </TabsTrigger>
                  <TabsTrigger value="urgent" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                    Urgent
                  </TabsTrigger>
                  <TabsTrigger value="users" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                    Recent Users
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="recent" className="mt-2">
                <Card className="bg-zinc-800 border-zinc-700 text-white">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <CardTitle>Recent Complaints</CardTitle>
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                          <Input
                            placeholder="Search complaints..."
                            className="pl-8 bg-zinc-900 border-zinc-700 text-white w-full sm:w-[200px] h-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white w-[130px] h-9">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                      </div>
                    ) : filteredComplaints.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400">
                        No complaints match your search
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredComplaints.map(complaint => (
                          <div 
                            key={complaint._id} 
                            className="p-4 rounded-lg bg-zinc-900 hover:bg-zinc-850 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <Link 
                                  href={`/admin/complaints/${complaint._id}`}
                                  className="text-base font-medium hover:text-purple-400 transition-colors"
                                >
                                  {complaint.title}
                                </Link>
                                <div className="flex items-center text-xs text-zinc-400 mt-1">
                                  <span className="inline-block px-2 py-0.5 bg-zinc-800 rounded text-zinc-300 mr-2">
                                    {complaint.category}
                                  </span>
                                  <span className="mr-2">•</span>
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {formatDate(complaint.createdAt)}
                                  <span className="mx-2">•</span>
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  {complaint.votes}
                                </div>
                              </div>
                              {getStatusBadge(complaint.status)}
                            </div>
                            <div className="mt-2 flex justify-end gap-2 items-center">
                              <div>
                                <Select 
                                  value={complaint.status} 
                                  onValueChange={(value) => handleStatusChange(complaint._id, value)}
                                >
                                  <SelectTrigger className="h-8 bg-zinc-800 border-zinc-700 text-white w-[130px]">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                                asChild
                              >
                                <Link href={`/admin/complaints/${complaint._id}`}>
                                  View
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4 text-center">
                      <Button 
                        asChild 
                        variant="outline" 
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                      >
                        <Link href="/admin/complaints">View All Complaints</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="urgent" className="mt-2">
                <Card className="bg-zinc-800 border-zinc-700 text-white">
                  <CardHeader>
                    <CardTitle>Urgent Complaints</CardTitle>
                    <CardDescription className="text-zinc-400">
                      High-priority complaints requiring immediate attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : filteredComplaints.filter(c => c.votes > 10).length === 0 ? (
                      <div className="text-center py-10 text-zinc-500">
                        <p>No urgent complaints at this time</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredComplaints
                          .filter(c => c.votes > 10)
                          .map(complaint => (
                            <div 
                              key={complaint._id} 
                              className="p-4 rounded-lg bg-zinc-900 hover:bg-zinc-850 transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <Link 
                                    href={`/admin/complaints/${complaint._id}`}
                                    className="text-base font-medium hover:text-purple-400 transition-colors"
                                  >
                                    {complaint.title}
                                  </Link>
                                  <div className="flex items-center text-xs text-zinc-400 mt-1">
                                    <span className="inline-block px-2 py-0.5 bg-zinc-800 rounded text-zinc-300 mr-2">
                                      {complaint.category}
                                    </span>
                                    <span className="mr-2">•</span>
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(complaint.createdAt)}
                                    <span className="mx-2">•</span>
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    {complaint.votes}
                                  </div>
                                </div>
                                {getStatusBadge(complaint.status)}
                              </div>
                              <div className="mt-2 flex justify-end gap-2 items-center">
                                <div>
                                  <Select 
                                    value={complaint.status} 
                                    onValueChange={(value) => handleStatusChange(complaint._id, value)}
                                  >
                                    <SelectTrigger className="h-8 bg-zinc-800 border-zinc-700 text-white w-[130px]">
                                      <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="in-progress">In Progress</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                                  asChild
                                >
                                  <Link href={`/admin/complaints/${complaint._id}`}>
                                    View
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="users" className="mt-2">
                <Card className="bg-zinc-800 border-zinc-700 text-white">
                  <CardHeader>
                    <CardTitle>Recent Users</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Latest users who joined the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-10 text-zinc-500">
                      <p>User data will be displayed here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      {/* Update the complaints table to include the timer */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-700">
          <thead className="bg-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-zinc-900 divide-y divide-zinc-700">
            {filteredComplaints.map((complaint) => (
              <tr key={complaint._id} className="hover:bg-zinc-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{complaint.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-zinc-300">{complaint.category}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(complaint.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ComplaintTimer 
                    createdAt={complaint.createdAt} 
                    complaintId={complaint._id}
                    status={complaint.status}
                    updatedAt={complaint.updatedAt}
                    onLongDuration={(duration) => handleLongDuration(complaint._id, duration)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link href={`/admin/complaints/${complaint._id}`} className="text-indigo-400 hover:text-indigo-300">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 