import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const userProfile = await db.collection("users").findOne({ userId: user.id });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { phone, address, bio, notificationPreferences } = data;

    // Validate input
    if (notificationPreferences && typeof notificationPreferences !== "object") {
      return NextResponse.json(
        { error: "Invalid notification preferences format" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Check if user exists
    const existingUser = await db.collection("users").findOne({ userId: user.id });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user profile
    const updateData: any = {
      $set: {
        updatedAt: new Date(),
      },
    };

    // Only update fields that are provided
    if (phone !== undefined) updateData.$set.phone = phone;
    if (address !== undefined) updateData.$set.address = address;
    if (bio !== undefined) updateData.$set.bio = bio;
    if (notificationPreferences !== undefined) {
      updateData.$set.notificationPreferences = {
        email: notificationPreferences.email ?? existingUser.notificationPreferences?.email ?? true,
        push: notificationPreferences.push ?? existingUser.notificationPreferences?.push ?? true,
      };
    }

    const result = await db.collection("users").updateOne(
      { userId: user.id },
      updateData
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get updated user
    const updatedUser = await db.collection("users").findOne({ userId: user.id });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
} 