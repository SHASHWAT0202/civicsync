import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { currentUser } from "@clerk/nextjs/server";

// POST /api/admin/remove - Remove admin privileges from a user
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is super admin
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get super admin email from environment variables
    const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "shashwat02022005@gmail.com";
    
    // Verify super admin access
    const isSuperAdmin = user.emailAddresses.some(
      email => email.emailAddress === superAdminEmail
    );
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }
    
    // Get email from request body
    const data = await request.json();
    const { email } = data;
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    // Prevent removing super admin
    if (email === superAdminEmail) {
      return NextResponse.json(
        { error: "Cannot remove super admin privileges" },
        { status: 403 }
      );
    }
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Check if user exists and is an admin
    const existingUser = await db.collection("users").findOne({ email });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    if (existingUser.role === "super-admin") {
      return NextResponse.json(
        { error: "Cannot remove super admin privileges" },
        { status: 403 }
      );
    }
    
    if (existingUser.role !== "admin") {
      return NextResponse.json(
        { message: "User is not an admin" },
        { status: 200 }
      );
    }
    
    // Update user role to regular user
    await db.collection("users").updateOne(
      { email },
      { $set: { role: "user", updatedAt: new Date() } }
    );
    
    return NextResponse.json(
      { message: "Admin privileges removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing admin privileges:", error);
    return NextResponse.json(
      { error: "Failed to remove admin privileges" },
      { status: 500 }
    );
  }
} 