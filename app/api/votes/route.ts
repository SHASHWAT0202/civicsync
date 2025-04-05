import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Vote from "@/models/Vote";
import Complaint from "@/models/Complaint";
import { ObjectId } from "mongodb";

// POST /api/votes - Add a vote to a complaint
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
    const { complaintId } = data;
    
    if (!complaintId) {
      return NextResponse.json(
        { error: "Complaint ID is required" },
        { status: 400 }
      );
    }
    
    // Check if user has already voted for this complaint
    const existingVote = await db.collection("votes").findOne({
      complaintId,
      userId: user.id
    });
    
    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted for this complaint" },
        { status: 400 }
      );
    }
    
    // Create new vote
    const newVote = {
      complaintId,
      userId: user.id,
      createdAt: new Date().toISOString()
    };
    
    await db.collection("votes").insertOne(newVote);
    
    // Update complaint vote count
    await db.collection("complaints").updateOne(
      { _id: new ObjectId(complaintId) },
      { $inc: { votes: 1 } }
    );
    
    // Get updated complaint
    const updatedComplaint = await db.collection("complaints").findOne({ _id: new ObjectId(complaintId) });
    
    return NextResponse.json({
      message: "Vote recorded successfully",
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error("Error recording vote:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}

// DELETE /api/votes - Remove a vote from a complaint
export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const complaintId = url.searchParams.get("complaintId");

    if (!complaintId) {
      return NextResponse.json(
        { error: "Complaint ID is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if the vote exists
    const vote = await db.collection("votes").findOne({
      complaintId,
      userId: user.id,
    });

    if (!vote) {
      return NextResponse.json(
        { error: "Vote not found" },
        { status: 404 }
      );
    }

    // Delete the vote
    await db.collection("votes").deleteOne({
      complaintId,
      userId: user.id,
    });

    // Decrement the vote count on the complaint
    await db.collection("complaints").updateOne(
      { _id: new ObjectId(complaintId) },
      { $inc: { votes: -1 } }
    );

    return NextResponse.json({ message: "Vote removed successfully" });
  } catch (error) {
    console.error("Error removing vote:", error);
    return NextResponse.json(
      { error: "Failed to remove vote" },
      { status: 500 }
    );
  }
} 