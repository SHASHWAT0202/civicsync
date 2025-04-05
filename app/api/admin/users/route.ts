import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { currentUser } from "@clerk/nextjs/server";

// GET /api/admin/users - Get all admin users
export async function GET(request: NextRequest) {
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
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // First, ensure the super admin has the correct role in the database
    const existingSuperAdmin = await db.collection("users").findOne({ email: superAdminEmail });
    
    if (existingSuperAdmin) {
      // If the super admin exists but doesn't have super-admin role, update it
      if (existingSuperAdmin.role !== "super-admin") {
        await db.collection("users").updateOne(
          { email: superAdminEmail },
          { $set: { role: "super-admin", updatedAt: new Date() } }
        );
      }
    } else {
      // Create the super admin user if it doesn't exist
      await db.collection("users").insertOne({
        email: superAdminEmail,
        role: "super-admin",
        firstName: "Super",
        lastName: "Admin",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Get all admin and super-admin users
    const adminUsers = await db
      .collection("users")
      .find({ role: { $in: ["admin", "super-admin"] } })
      .project({ email: 1, role: 1, firstName: 1, lastName: 1, _id: 0 })
      .toArray();
    
    // Make sure super admin is in the list with the right role
    const superAdminExists = adminUsers.some(admin => admin.email === superAdminEmail);
    
    if (!superAdminExists) {
      adminUsers.push({
        email: superAdminEmail,
        role: "super-admin",
        firstName: "Super",
        lastName: "Admin"
      });
    }
    
    return NextResponse.json({
      adminUsers
    });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin users" },
      { status: 500 }
    );
  }
} 