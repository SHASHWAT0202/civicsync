import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
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

    const { db } = await connectToDatabase();

    // Verify user has admin or super-admin role in DB
    const userEmail = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    )?.emailAddress;

    const superAdminEmail =
      process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "shashwat02022005@gmail.com";
    const isSuperAdmin = userEmail === superAdminEmail;

    if (!isSuperAdmin) {
      const dbUser = await db
        .collection("users")
        .findOne({ email: userEmail });
      if (!dbUser || !["admin", "super-admin"].includes(dbUser.role)) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    }

    const [
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      completedComplaints,
      rejectedComplaints,
      totalUsers,
      totalVotes,
      totalFeedbacks,
    ] = await Promise.all([
      db.collection("complaints").countDocuments(),
      db.collection("complaints").countDocuments({ status: "pending" }),
      db.collection("complaints").countDocuments({ status: "in-progress" }),
      db.collection("complaints").countDocuments({ status: "completed" }),
      db.collection("complaints").countDocuments({ status: "rejected" }),
      db.collection("users").countDocuments(),
      db.collection("votes").countDocuments(),
      db.collection("feedbacks").countDocuments(),
    ]);

    return NextResponse.json({
      stats: {
        totalComplaints,
        pendingComplaints,
        inProgressComplaints,
        completedComplaints,
        rejectedComplaints,
        totalUsers,
        totalVotes,
        totalFeedbacks,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
