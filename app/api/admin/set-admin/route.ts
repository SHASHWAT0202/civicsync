import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

// POST /api/admin/set-admin - Set a user as admin
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
    await db
      .collection("users")
      .updateOne({ email }, { $set: { role: "admin", updatedAt: new Date() } });

    // Find the user in Clerk by email and update their public metadata
    try {
      const clerk = await clerkClient();
      const clerkUsersResponse = await clerk.users.getUserList({
        emailAddress: [email],
      });

      const clerkUsers = clerkUsersResponse.data;

      if (clerkUsers.length > 0) {
        await clerk.users.updateUser(clerkUsers[0].id, {
          publicMetadata: { role: "admin" },
        });
      }
    } catch (clerkError) {
      console.error("Error updating Clerk metadata:", clerkError);
      // DB update already succeeded — don't fail the whole request
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} has been set as admin`,
    });
  } catch (error) {
    console.error("Error setting admin:", error);
    return NextResponse.json(
      { error: "Failed to set admin" },
      { status: 500 }
    );
  }
}
