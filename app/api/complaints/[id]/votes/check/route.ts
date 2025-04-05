import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { currentUser } from "@clerk/nextjs/server";

// GET /api/complaints/[id]/votes/check - Check if user has voted
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
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid complaint ID" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Check if user has voted using the authenticated user's ID
    const existingVote = await db.collection("votes").findOne({
      complaintId: id,
      userId: user.id
    });
    
    return NextResponse.json({
      hasVoted: !!existingVote
    });
  } catch (error) {
    console.error("Error checking vote:", error);
    return NextResponse.json(
      { error: "Failed to check vote status" },
      { status: 500 }
    );
  }
} 