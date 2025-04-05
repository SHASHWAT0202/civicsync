export interface Complaint {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  location: {
    lat: number;
    lng: number;
  };
  address?: string;
  images: string[];
  votes: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
}

export interface Comment {
  _id: string;
  complaintId: string;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  createdAt: string;
} 