import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the user's email
    const userEmail = user.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if the user is a super admin
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "shashwat02022005@gmail.com";
    const isSuperAdmin = userEmail === superAdminEmail;

    if (!isSuperAdmin) {
      // If not super admin, check if user has admin role in database
      const dbUser = await db.collection("users").findOne({ email: userEmail });
      
      if (!dbUser || dbUser.role !== 'admin') {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    }
    
    // Get count of users that Clerk has created (using clerk IDs)
    const totalUsers = await db.collection("users").countDocuments();
    
    return NextResponse.json({
      count: totalUsers
    });
  } catch (error) {
    console.error("Error fetching user count:", error);
    return NextResponse.json(
      { error: "Failed to fetch user count" },
      { status: 500 }
    );
  }
} 