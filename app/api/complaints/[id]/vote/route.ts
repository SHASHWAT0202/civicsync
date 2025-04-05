import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid complaint ID" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Find the complaint
    const complaint = await db
      .collection("complaints")
      .findOne({ _id: new ObjectId(id) });
    
    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }
    
    // Check if user has already voted
    const existingVote = await db
      .collection("votes")
      .findOne({
        complaintId: id,
        userId: user.id,
      });
    
    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted on this complaint" },
        { status: 400 }
      );
    }
    
    // Create a vote record
    await db.collection("votes").insertOne({
      complaintId: id,
      userId: user.id,
      createdAt: new Date().toISOString(),
    });
    
    // Increment the vote count on the complaint
    const result = await db
      .collection("complaints")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $inc: { votes: 1 } },
        { returnDocument: "after" }
      );
    
    // Update user rewards for receiving a vote
    try {
      await fetch(`${request.nextUrl.origin}/api/users/rewards`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "RECEIVED_VOTE"
        }),
      });
    } catch (rewardError) {
      console.error("Error updating rewards:", rewardError);
      // Continue even if reward update fails
    }
    
    return NextResponse.json({
      votes: result.value.votes,
      message: "Vote recorded successfully",
    });
  } catch (error) {
    console.error("Error voting on complaint:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid complaint ID" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Check if user has already voted
    const existingVote = await db
      .collection("votes")
      .findOne({
        complaintId: id,
        userId: user.id,
      });
    
    return NextResponse.json({
      hasVoted: !!existingVote,
    });
  } catch (error) {
    console.error("Error checking vote status:", error);
    return NextResponse.json(
      { error: "Failed to check vote status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid complaint ID" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Find the complaint
    const complaint = await db
      .collection("complaints")
      .findOne({ _id: new ObjectId(id) });
    
    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }
    
    // Check if user has already voted
    const existingVote = await db
      .collection("votes")
      .findOne({
        complaintId: id,
        userId: user.id,
      });
    
    if (!existingVote) {
      return NextResponse.json(
        { error: "You have not voted on this complaint" },
        { status: 400 }
      );
    }
    
    // Remove the vote record
    await db.collection("votes").deleteOne({
      complaintId: id,
      userId: user.id,
    });
    
    // Decrement the vote count on the complaint
    const result = await db
      .collection("complaints")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $inc: { votes: -1 } },
        { returnDocument: "after" }
      );
    
    return NextResponse.json({
      votes: result.value.votes,
      message: "Vote removed successfully",
    });
  } catch (error) {
    console.error("Error removing vote:", error);
    return NextResponse.json(
      { error: "Failed to remove vote" },
      { status: 500 }
    );
  }
} 