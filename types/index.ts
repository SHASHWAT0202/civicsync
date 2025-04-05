export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  badges: Badge[];
  createdAt: Date;
  updatedAt: Date;
}

export type ComplaintStatus = 'pending' | 'in-progress' | 'completed' | 'rejected';

export type ComplaintCategory = 
  | 'potholes' 
  | 'road-breaks' 
  | 'sewer-issues' 
  | 'water-supply' 
  | 'electricity' 
  | 'garbage' 
  | 'other';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  location: Location;
  images: string[];
  votes: number;
  isFake: boolean;
  isVisible: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vote {
  id: string;
  complaintId: string;
  userId: string;
  createdAt: Date;
}

export interface Feedback {
  id: string;
  complaintId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export type BadgeType = 
  | 'first-complaint' 
  | 'five-resolved' 
  | 'resolution-hero';

export interface Badge {
  type: BadgeType;
  awardedAt: Date;
} 