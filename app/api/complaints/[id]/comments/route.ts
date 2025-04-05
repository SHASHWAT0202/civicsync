import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    
    // Get comments for this complaint
    const comments = await db
      .collection("comments")
      .find({ complaintId: id })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
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

    const data = await request.json();
    const { content, parentId } = data;
    
    // Validate comment content
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    const newComment = {
      complaintId: new ObjectId(id),
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      content,
      parentId: parentId ? new ObjectId(parentId) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("comments").insertOne(newComment);
    
    // Update user rewards for adding a comment
    try {
      await fetch(`${request.nextUrl.origin}/api/users/rewards`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "ADDED_COMMENT"
        }),
      });
    } catch (rewardError) {
      console.error("Error updating rewards:", rewardError);
      // We don't want to fail the comment submission if rewards update fails
    }

    return NextResponse.json({
      comment: {
        ...newComment,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
} 