import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// POST /api/complaints/[id]/votes - Vote on a complaint
export async function POST(
  req: NextRequest,
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

    const { id } = params;
    
    // Validate complaint ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid complaint ID" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Check if complaint exists
    const complaint = await db
      .collection("complaints")
      .findOne({ _id: new ObjectId(id) });
    
    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }

    // Check if user already voted
    const existingVote = await db.collection("votes").findOne({
      complaintId: new ObjectId(id),
      userId: user.id
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted on this complaint" },
        { status: 409 }
      );
    }

    // Create the vote
    const vote = {
      complaintId: new ObjectId(id),
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      createdAt: new Date()
    };

    await db.collection("votes").insertOne(vote);

    // Update complaint vote count
    await db.collection("complaints").updateOne(
      { _id: new ObjectId(id) },
      { $inc: { votes: 1 } }
    );

    // If the complaint creator is not the voter, update creator's rewards
    if (complaint.userId !== user.id) {
      try {
        // Update the complaint creator's rewards for receiving a vote
        await fetch(`${req.nextUrl.origin}/api/users/rewards`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": complaint.userId // Pass the complaint creator's ID
          },
          body: JSON.stringify({
            action: "RECEIVED_VOTE"
          }),
        });
      } catch (rewardError) {
        console.error("Error updating rewards for vote:", rewardError);
        // We don't fail the voting process if rewards update fails
      }
    }

    return NextResponse.json({
      message: "Vote added successfully",
      currentVotes: (complaint.votes || 0) + 1
    });
  } catch (error) {
    console.error("Error adding vote:", error);
    return NextResponse.json(
      { error: "Failed to add vote" },
      { status: 500 }
    );
  }
}

// DELETE /api/complaints/[id]/votes - Remove vote from a complaint
export async function DELETE(
  req: NextRequest,
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

    const { id } = params;
    
    // Validate complaint ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid complaint ID" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Check if complaint exists
    const complaint = await db
      .collection("complaints")
      .findOne({ _id: new ObjectId(id) });
    
    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }

    // Check if user has voted
    const vote = await db.collection("votes").findOne({
      complaintId: new ObjectId(id),
      userId: user.id
    });

    if (!vote) {
      return NextResponse.json(
        { error: "You have not voted on this complaint" },
        { status: 404 }
      );
    }

    // Remove the vote
    await db.collection("votes").deleteOne({
      complaintId: new ObjectId(id),
      userId: user.id
    });

    // Update complaint vote count
    await db.collection("complaints").updateOne(
      { _id: new ObjectId(id) },
      { $inc: { votes: -1 } }
    );

    return NextResponse.json({
      message: "Vote removed successfully",
      currentVotes: Math.max(0, (complaint.votes || 1) - 1)
    });
  } catch (error) {
    console.error("Error removing vote:", error);
    return NextResponse.json(
      { error: "Failed to remove vote" },
      { status: 500 }
    );
  }
}

// Get votes for a complaint
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Validate complaint ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid complaint ID" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Check if complaint exists
    const complaint = await db
      .collection("complaints")
      .findOne({ _id: new ObjectId(id) });
    
    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }

    // Get user's vote status
    const { userId } = auth();
    let hasVoted = false;
    
    if (userId) {
      const vote = await db.collection("votes").findOne({
        complaintId: new ObjectId(id),
        userId
      });
      
      hasVoted = !!vote;
    }

    return NextResponse.json({
      votes: complaint.votes || 0,
      hasVoted
    });
  } catch (error) {
    console.error("Error getting votes:", error);
    return NextResponse.json(
      { error: "Failed to get votes" },
      { status: 500 }
    );
  }
} 