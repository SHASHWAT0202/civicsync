import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

// POST /api/admin/set-admin - Set a user as admin
export async function POST(request: NextRequest) {
  try {
    // Check if the current user is already an admin
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Get the email from the request body
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    // Find the user by email in MongoDB
    const targetUser = await db.collection("users").findOne({ email });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }
    
    // Update the user's role to admin in MongoDB
    await db.collection("users").updateOne(
      { email },
      { $set: { role: "admin" } }
    );
    
    // Find the user in Clerk by email
    const clerkUsers = await clerkClient.users.getUserList({
      emailAddress: [email],
    });
    
    if (clerkUsers.length === 0) {
      return NextResponse.json(
        { error: "User not found in Clerk" },
        { status: 404 }
      );
    }
    
    const clerkUser = clerkUsers[0];
    
    // Update the user's public metadata in Clerk
    await clerkClient.users.updateUser(clerkUser.id, {
      publicMetadata: { role: "admin" },
    });
    
    return NextResponse.json({
      success: true,
      message: `User ${email} has been set as admin in both database and Clerk`,
    });
  } catch (error) {
    console.error("Error setting admin:", error);
    return NextResponse.json(
      { error: "Failed to set admin" },
      { status: 500 }
    );
  }
} 