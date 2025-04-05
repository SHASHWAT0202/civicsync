import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { auth, currentUser } from "@clerk/nextjs/server";
import { sendComplaintStatusUpdateEmail } from "@/lib/email";

// GET /api/complaints/[id] - Get a specific complaint
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
    
    const complaint = await db
      .collection("complaints")
      .findOne({ _id: new ObjectId(id) });
    
    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ complaint });
  } catch (error) {
    console.error("Error fetching complaint:", error);
    return NextResponse.json(
      { error: "Failed to fetch complaint" },
      { status: 500 }
    );
  }
}

// PUT /api/complaints/[id] - Update a complaint
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
    
    // Check if user is authorized to update the complaint
    const dbUser = await db.collection("users").findOne({ clerkId: user.id });
    
    if (complaint.userId !== user.id && dbUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Not authorized to update this complaint" },
        { status: 403 }
      );
    }
    
    // Get update data from request
    const data = await request.json();
    
    // Update complaint
    const result = await db.collection("complaints").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date().toISOString() } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }
    
    // Get updated complaint
    const updatedComplaint = await db
      .collection("complaints")
      .findOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({ complaint: updatedComplaint });
  } catch (error) {
    console.error("Error updating complaint:", error);
    return NextResponse.json(
      { error: "Failed to update complaint" },
      { status: 500 }
    );
  }
}

// DELETE /api/complaints/[id] - Delete a complaint
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
    
    // Check if user is authorized to delete the complaint
    const dbUser = await db.collection("users").findOne({ clerkId: user.id });
    
    if (complaint.userId !== user.id && dbUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Not authorized to delete this complaint" },
        { status: 403 }
      );
    }
    
    // Delete complaint
    const result = await db.collection("complaints").deleteOne({
      _id: new ObjectId(id),
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Complaint deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting complaint:", error);
    return NextResponse.json(
      { error: "Failed to delete complaint" },
      { status: 500 }
    );
  }
}

// PATCH /api/complaints/[id] - Update complaint status and other properties
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if the user is a super admin
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "shashwat02022005@gmail.com";
    const isSuperAdmin = userEmail === superAdminEmail;

    if (!isSuperAdmin) {
      // If not super admin, check if user has admin role in database
      const { db } = await connectToDatabase();
      const dbUser = await db.collection("users").findOne({ email: userEmail });
      
      if (!dbUser || dbUser.role !== 'admin') {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
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
    
    // Get the current complaint
    const complaint = await db
      .collection("complaints")
      .findOne({ _id: new ObjectId(id) });
    
    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }

    const data = await req.json();
    
    // Validate update data
    if (data.status && !["pending", "in-progress", "completed", "rejected"].includes(data.status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Create update object
    const updateFields: any = {};
    const allowedFields = ["status", "isVisible", "isFake", "adminNotes"];
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateFields[field] = data[field];
      }
    });
    
    updateFields.updatedAt = new Date();

    // Update the complaint in the database
    const result = await db.collection("complaints").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update complaint" },
        { status: 500 }
      );
    }

    // Send status update email if status has changed
    if (data.status && data.status !== complaint.status) {
      try {
        // Get the user who created the complaint
        const complainantData = await db.collection("users").findOne({ clerkId: complaint.userId });
        if (complainantData && complainantData.email) {
          await sendComplaintStatusUpdateEmail(
            complainantData.email,
            complainantData.firstName || 'User',
            complaint.title,
            data.status,
            id,
            data.adminNotes || '',
            req.nextUrl.origin
          );
          console.log(`Status update email sent to ${complainantData.email} for complaint: ${complaint.title}`);
        }
      } catch (emailError) {
        console.error("Error sending complaint status update email:", emailError);
        // Don't fail status update if email fails
      }
    }

    // Check if the status changed to "completed" and update rewards for the complaint creator
    const wasStatusUpdatedToCompleted = 
      data.status === "completed" && complaint.status !== "completed";
    
    if (wasStatusUpdatedToCompleted) {
      try {
        await fetch(`${req.nextUrl.origin}/api/users/rewards`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": complaint.userId // Pass the complaint creator's ID
          },
          body: JSON.stringify({
            action: "COMPLAINT_RESOLVED"
          }),
        });
      } catch (rewardError) {
        console.error("Error updating rewards for complaint resolution:", rewardError);
        // We don't fail the status update if rewards update fails
      }
    }

    // Get the updated complaint for the response
    const updatedComplaint = await db
      .collection("complaints")
      .findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      message: "Complaint updated successfully",
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error("Error updating complaint:", error);
    return NextResponse.json(
      { error: "Failed to update complaint" },
      { status: 500 }
    );
  }
} 