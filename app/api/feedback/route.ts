import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/db";
import Feedback from "@/models/Feedback";
import Complaint from "@/models/Complaint";

// POST /api/feedback - Submit feedback for a resolved complaint
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { complaintId, rating, comment } = body;

    if (!complaintId || !rating) {
      return NextResponse.json(
        { error: "Complaint ID and rating are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if the complaint exists and is completed
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }

    if (complaint.status !== "completed") {
      return NextResponse.json(
        { error: "Feedback can only be provided for completed complaints" },
        { status: 400 }
      );
    }

    // Check if the user has already provided feedback for this complaint
    const existingFeedback = await Feedback.findOne({
      complaintId,
      userId: user.id,
    });

    if (existingFeedback) {
      return NextResponse.json(
        { error: "You have already provided feedback for this complaint" },
        { status: 400 }
      );
    }

    // Create the feedback
    const feedback = await Feedback.create({
      complaintId,
      userId: user.id,
      rating,
      comment: comment || "",
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error: any) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

// GET /api/feedback - Get feedback for a complaint
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const complaintId = searchParams.get("complaintId");

    await connectToDatabase();

    const query = complaintId ? { complaintId } : { userId: user.id };
    const feedbacks = await Feedback.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ feedbacks });
  } catch (error: any) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedbacks" },
      { status: 500 }
    );
  }
} 