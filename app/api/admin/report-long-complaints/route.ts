import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { currentUser } from "@clerk/nextjs/server";
import { sendComplaintStatusUpdateEmail } from "@/lib/email";
import { ObjectId } from "mongodb";

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
    const { complaintId, duration } = await request.json();

    if (!complaintId || !duration) {
      return NextResponse.json(
        { error: "Complaint ID and duration are required" },
        { status: 400 }
      );
    }

    // Get complaint details - use ObjectId to properly query MongoDB
    const complaint = await db.collection("complaints").findOne({ 
      _id: new ObjectId(complaintId) 
    });
    
    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }

    // Get super admin email from environment variables
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "shashwat02022005@gmail.com";

    // Send email to super admin using the existing email function
    await sendComplaintStatusUpdateEmail(
      superAdminEmail,
      "Super Admin",
      complaintId,
      complaint.title,
      complaint.status,
      `This complaint has been pending for ${duration} days and requires your attention.`
    );

    // Update complaint to mark it as reported
    await db.collection("complaints").updateOne(
      { _id: new ObjectId(complaintId) },
      { 
        $set: { 
          reportedToSuperAdmin: true,
          reportedAt: new Date()
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: "Long-pending complaint reported to super admin"
    });
  } catch (error) {
    console.error("Error reporting long-pending complaint:", error);
    return NextResponse.json(
      { error: "Failed to report long-pending complaint" },
      { status: 500 }
    );
  }
} 