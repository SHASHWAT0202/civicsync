import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Complaint from "@/models/Complaint";
import User from "@/models/User";
import Vote from "@/models/Vote";
import Feedback from "@/models/Feedback";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();

    // Check if user is authenticated
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is an admin
    if (!user.publicMetadata?.role || user.publicMetadata.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Get the user from the database
    const userFromDB = await User.findOne({ clerkId: user.id });

    // Get total complaints count
    const totalComplaints = await Complaint.countDocuments();

    // Get complaints by status
    const pendingComplaints = await Complaint.countDocuments({ status: "pending" });
    const inProgressComplaints = await Complaint.countDocuments({ status: "in-progress" });
    const completedComplaints = await Complaint.countDocuments({ status: "completed" });
    const rejectedComplaints = await Complaint.countDocuments({ status: "rejected" });

    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get total votes count
    const totalVotes = await Vote.countDocuments();

    // Get total feedbacks count
    const totalFeedbacks = await Feedback.countDocuments();

    // Return the stats
    return NextResponse.json({
      stats: {
        totalComplaints,
        pendingComplaints,
        inProgressComplaints,
        completedComplaints,
        rejectedComplaints,
        totalUsers,
        totalVotes,
        totalFeedbacks,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 