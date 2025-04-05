import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { currentUser } from "@clerk/nextjs/server";
import { ObjectId } from "mongodb";

// GET /api/feedbacks - Get feedbacks for a complaint
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const complaintId = searchParams.get("complaintId");
    
    if (!complaintId) {
      return NextResponse.json(
        { error: "Complaint ID is required" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Check if complaint exists
    if (!ObjectId.isValid(complaintId)) {
      return NextResponse.json(
        { error: "Invalid complaint ID" },
        { status: 400 }
      );
    }
    
    const complaint = await db
      .collection("complaints")
      .findOne({ _id: new ObjectId(complaintId) });
    
    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }
    
    // Get feedbacks for the complaint
    const feedbacks = await db
      .collection("feedbacks")
      .find({ complaintId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedbacks" },
      { status: 500 }
    );
  }
}

// POST /api/feedbacks - Add feedback to a complaint
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    const data = await request.json();
    const { complaintId, content } = data;
    
    if (!complaintId || !content) {
      return NextResponse.json(
        { error: "Complaint ID and content are required" },
        { status: 400 }
      );
    }
    
    // Check if complaint exists
    if (!ObjectId.isValid(complaintId)) {
      return NextResponse.json(
        { error: "Invalid complaint ID" },
        { status: 400 }
      );
    }
    
    const complaint = await db
      .collection("complaints")
      .findOne({ _id: new ObjectId(complaintId) });
    
    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }
    
    // Create new feedback
    const newFeedback = {
      complaintId,
      userId: user.id,
      userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Anonymous",
      userEmail: user.emailAddresses[0].emailAddress,
      content,
      createdAt: new Date().toISOString(),
    };
    
    const result = await db.collection("feedbacks").insertOne(newFeedback);
    
    return NextResponse.json({
      feedback: {
        ...newFeedback,
        _id: result.insertedId,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding feedback:", error);
    return NextResponse.json(
      { error: "Failed to add feedback" },
      { status: 500 }
    );
  }
} 