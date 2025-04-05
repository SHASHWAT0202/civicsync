"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { MessageCircle } from "lucide-react";

interface Comment {
  _id: string;
  complaintId: string;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  createdAt: string;
}

interface CommentSectionProps {
  complaintId: string;
}

export default function CommentSection({ complaintId }: CommentSectionProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [complaintId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/complaints/${complaintId}/comments`);
      
      if (!response.ok) {
        setError("Failed to load comments");
        // Use mock data for demo purposes
        setComments([
          {
            _id: "1",
            complaintId,
            userId: "user1",
            userName: "Jane Doe",
            content: "I've noticed this issue as well. Hope it gets fixed soon!",
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          },
          {
            _id: "2",
            complaintId,
            userId: "user2",
            userName: "John Smith",
            content: "The city council mentioned they would address this in their last meeting.",
            createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
          }
        ]);
        return;
      }
      
      const data = await response.json();
      setComments(data.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setError("An error occurred while loading comments");
      // Use mock data for demo purposes
      setComments([
        {
          _id: "1",
          complaintId,
          userId: "user1",
          userName: "Jane Doe",
          content: "I've noticed this issue as well. Hope it gets fixed soon!",
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        },
        {
          _id: "2",
          complaintId,
          userId: "user2",
          userName: "John Smith",
          content: "The city council mentioned they would address this in their last meeting.",
          createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      toast({
        title: "Authentication required",
        description: "Please sign in to comment",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/complaints/${complaintId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit comment");
      }

      const data = await response.json();
      setComments(prev => [data.comment, ...prev]);
      setNewComment("");
      
      toast({
        title: "Comment submitted",
        description: "Your comment has been added successfully",
      });
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Error",
        description: "Failed to submit your comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageCircle className="mr-2 h-5 w-5" />
          Comments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-700">
              {error} - Showing sample data for demonstration purposes.
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmitComment} className="mb-6">
          <Textarea
            placeholder={isSignedIn ? "Add your comment..." : "Please sign in to comment"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!isSignedIn || isSubmitting}
            className="mb-3"
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!isSignedIn || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Comment"}
            </Button>
          </div>
        </form>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment._id} className="flex space-x-4">
                <Avatar>
                  <AvatarImage src={comment.userImage} />
                  <AvatarFallback>{getInitials(comment.userName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{comment.userName}</h4>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1 text-gray-700 whitespace-pre-line">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 