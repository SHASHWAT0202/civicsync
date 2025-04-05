import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(
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
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Check if requesting user is admin or the user themselves
    const dbUser = await db.collection("users").findOne({ clerkId: user.id });
    const isAdmin = dbUser?.role === "admin";
    const isSelf = id === dbUser?._id.toString();
    
    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: "Not authorized to access this user" },
        { status: 403 }
      );
    }
    
    const targetUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user: targetUser });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const data = await request.json();
    
    // Check if requesting user is admin or the user themselves
    const dbUser = await db.collection("users").findOne({ clerkId: user.id });
    const isAdmin = dbUser?.role === "admin";
    const isSelf = id === dbUser?._id.toString();
    
    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: "Not authorized to update this user" },
        { status: 403 }
      );
    }
    
    // Find the user
    const targetUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Prevent non-admins from changing role
    if (!isAdmin && data.role && data.role !== targetUser.role) {
      return NextResponse.json(
        { error: "Not authorized to change role" },
        { status: 403 }
      );
    }
    
    // Update the user
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
    
    return NextResponse.json({
      user: {
        ...targetUser,
        ...updateData,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
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
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Check if requesting user is admin
    const dbUser = await db.collection("users").findOne({ clerkId: user.id });
    
    if (!dbUser || dbUser.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    
    // Find the user
    const targetUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Delete the user
    await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(id) });
    
    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
} 