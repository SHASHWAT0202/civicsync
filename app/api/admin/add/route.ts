import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { currentUser } from "@clerk/nextjs/server";

// POST /api/admin/add - Add a new admin user
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
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Special case for the super admin email
    if (email === superAdminEmail) {
      // Check if super admin exists
      const existingSuperAdmin = await db.collection("users").findOne({ email: superAdminEmail });
      
      if (existingSuperAdmin) {
        // If the super admin exists but doesn't have super-admin role, update it
        if (existingSuperAdmin.role !== "super-admin") {
          await db.collection("users").updateOne(
            { email: superAdminEmail },
            { $set: { role: "super-admin", updatedAt: new Date() } }
          );
          
          return NextResponse.json(
            { message: "Updated to super admin role successfully" },
            { status: 200 }
          );
        }
        
        return NextResponse.json(
          { message: "User is already a super admin" },
          { status: 200 }
        );
      } else {
        // Create super admin user
        const newUser = {
          email: superAdminEmail,
          role: "super-admin",
          firstName: "Super",
          lastName: "Admin",
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.collection("users").insertOne(newUser);
        
        return NextResponse.json(
          { message: "New super admin user created successfully" },
          { status: 201 }
        );
      }
    }
    
    // For regular admin users
    // Check if user exists
    const existingUser = await db.collection("users").findOne({ email });
    
    if (existingUser) {
      // Update user role to admin if not already
      if (existingUser.role === "admin") {
        return NextResponse.json(
          { message: "User is already an admin" },
          { status: 200 }
        );
      }
      
      await db.collection("users").updateOne(
        { email },
        { $set: { role: "admin", updatedAt: new Date() } }
      );
      
      return NextResponse.json(
        { message: "User updated to admin role successfully" },
        { status: 200 }
      );
    } else {
      // Create new admin user
      const newUser = {
        email,
        role: "admin",
        firstName: "Admin",
        lastName: "User",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection("users").insertOne(newUser);
      
      return NextResponse.json(
        { message: "New admin user created successfully" },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error adding admin user:", error);
    return NextResponse.json(
      { error: "Failed to add admin user" },
      { status: 500 }
    );
  }
} 