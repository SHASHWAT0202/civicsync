import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { currentUser } from "@clerk/nextjs/server";
import { sendComplaintSubmissionEmail } from "@/lib/email";

// GET /api/complaints - Get all complaints
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isPublic = searchParams.get("public") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const myComplaints = searchParams.get("myComplaints") === "true";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Build the filter
    const filter: any = {};
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }
    
    // Add category filter if provided
    if (category) {
      filter.category = category;
    }
    
    // Add search filter if provided
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    
    // Check for admin parameter
    const isAdmin = searchParams.get("admin") === "true";

    // If not public or admin, check for user authentication
    if (!isPublic && !isAdmin) {
      const user = await currentUser();
      
      if (!user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      
      // Get user from database
      const dbUser = await db.collection("users").findOne({ clerkId: user.id });
      
      if (!dbUser) {
        // If user not found in database, create a new user record
        const newUser = {
          clerkId: user.id,
          email: user.emailAddresses[0].emailAddress,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          role: "user", // Default role
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await db.collection("users").insertOne(newUser);
      }
      
      // If myComplaints is true, only show user's complaints
      if (myComplaints) {
        filter.userId = user.id;
      } else if (dbUser?.role !== "admin") {
        // If not admin, only show public complaints or user's own complaints
        filter.$or = [
          { isPublic: true },
          { userId: user.id }
        ];
      }
    } else if (isAdmin) {
      // For admin requests, verify the user is an admin
      const user = await currentUser();
      
      if (!user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      
      // Get super admin email from environment variables
      const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "shashwat02022005@gmail.com";
      
      // Check if the user is a super admin (always has access)
      const isSuperAdmin = user.emailAddresses.some(
        email => email.emailAddress === superAdminEmail
      );
      
      if (isSuperAdmin) {
        // Super admin has full access - no additional filters
      } else {
        // Otherwise, check if the user has admin role in the database
        const userEmail = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress;
        
        if (!userEmail) {
          return NextResponse.json(
            { error: "Email not found" },
            { status: 401 }
          );
        }
        
        const dbUser = await db.collection("users").findOne({ email: userEmail });
        
        // Only users with admin role can access admin endpoints
        if (!dbUser || dbUser.role !== "admin") {
          return NextResponse.json(
            { error: "Admin access required" },
            { status: 403 }
          );
        }
      }
      
      // Admin can see all complaints, including invisible ones
      // So we don't add any additional filters
    } else if (isPublic) {
      // If public, only show public complaints
      filter.isVisible = { $ne: false }; // Show all complaints that are not explicitly hidden
    }
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get total count of complaints matching the filter
    const total = await db.collection("complaints").countDocuments(filter);
    
    // Get complaints with pagination
    const complaints = await db
      .collection("complaints")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      complaints,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { error: "Failed to fetch complaints" },
      { status: 500 }
    );
  }
}

// POST /api/complaints - Create a new complaint
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const data = await req.json();

    // Validate required fields
    const { title, description, location, category, images } = data;
    if (!title || !description || !location || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prepare the complaint document
    const complaint = {
      title,
      description,
      location,
      category,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      status: "pending",
      votes: 0,
      isVisible: true,
      isFake: false,
      images: images || [], // Ensure images array is properly included
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert the complaint
    const result = await db.collection("complaints").insertOne(complaint);
    
    // Send confirmation email
    try {
      const userEmail = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress;
      if (userEmail) {
        await sendComplaintSubmissionEmail(
          userEmail,
          user.firstName || 'User',
          title,
          result.insertedId.toString(),
          req.nextUrl.origin
        );
        console.log(`Confirmation email sent to ${userEmail} for complaint: ${title}`);
      }
    } catch (emailError) {
      console.error("Error sending complaint confirmation email:", emailError);
      // Don't fail complaint submission if email fails
    }
    
    // Update user rewards for submitting a complaint
    try {
      console.log(`Updating rewards for user ${user.id} for submitting complaint`);
      
      // Instead of using fetch which may not work internally, directly update the rewards in the DB
      const rewardsCollection = db.collection("rewards");
      const userRewards = await rewardsCollection.findOne({ userId: user.id });
      
      if (!userRewards) {
        // Create default rewards for new users
        const defaultRewards = {
          userId: user.id,
          points: 40, // 25 initial points + 15 for first complaint
          level: 1,
          badges: [
            {
              id: 'newcomer',
              name: 'Newcomer',
              description: 'Welcome to CivicSync! You\'ve joined the community',
              category: 'engagement',
              unlocked: true,
              unlockedAt: new Date(),
              progress: 100
            },
            {
              id: 'first-complaint',
              name: 'First Complaint',
              description: 'You submitted your first complaint',
              category: 'complaints',
              unlocked: true,
              unlockedAt: new Date(),
              progress: 100
            },
            // Other badges with progress set appropriately
          ],
          stats: {
            totalComplaints: 1,
            completedComplaints: 0,
            pendingComplaints: 1,
            votes: 0,
            comments: 0,
          },
          updatedAt: new Date(),
        };
        
        await rewardsCollection.insertOne(defaultRewards);
        console.log(`Created initial rewards for user ${user.id} with 40 points (25 initial + 15 for first complaint)`);
      } else {
        // Update existing rewards
        const updatedStats = { ...userRewards.stats };
        const updatedBadges = [...userRewards.badges];
        let pointsToAdd = 15; // Base points for submitting a complaint
        
        // Update stats
        updatedStats.totalComplaints = (updatedStats.totalComplaints || 0) + 1;
        updatedStats.pendingComplaints = (updatedStats.pendingComplaints || 0) + 1;
        
        // Check for badge unlocks
        if (updatedStats.totalComplaints === 1) {
          const badgeIndex = updatedBadges.findIndex(b => b.id === 'first-complaint');
          if (badgeIndex !== -1 && !updatedBadges[badgeIndex].unlocked) {
            updatedBadges[badgeIndex].unlocked = true;
            updatedBadges[badgeIndex].unlockedAt = new Date();
            updatedBadges[badgeIndex].progress = 100;
            pointsToAdd += 25; // Bonus for badge
            console.log(`Unlocked "First Complaint" badge: +25 bonus points`);
          }
        }
        
        // Update active citizen badge progress
        if (updatedStats.totalComplaints >= 5) {
          const badgeIndex = updatedBadges.findIndex(b => b.id === 'active-citizen');
          if (badgeIndex !== -1 && !updatedBadges[badgeIndex].unlocked) {
            updatedBadges[badgeIndex].unlocked = true;
            updatedBadges[badgeIndex].unlockedAt = new Date();
            updatedBadges[badgeIndex].progress = 100;
            pointsToAdd += 50; // Bonus for badge
            console.log(`Unlocked "Active Citizen" badge: +50 bonus points`);
          }
        } else {
          const badgeIndex = updatedBadges.findIndex(b => b.id === 'active-citizen');
          if (badgeIndex !== -1) {
            updatedBadges[badgeIndex].progress = Math.min(
              Math.floor((updatedStats.totalComplaints / 5) * 100),
              99 // Cap at 99% until fully unlocked
            );
          }
        }
        
        const updatedPoints = userRewards.points + pointsToAdd;
        const updatedLevel = Math.floor(updatedPoints / 100) + 1;
        
        // Update the rewards document
        await rewardsCollection.updateOne(
          { userId: user.id },
          {
            $set: {
              points: updatedPoints,
              level: updatedLevel,
              badges: updatedBadges,
              stats: updatedStats,
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`Updated rewards for user ${user.id}: Added ${pointsToAdd} points, new total: ${updatedPoints}`);
      }
    } catch (rewardError) {
      console.error("Error updating rewards:", rewardError);
      // We don't want to fail the complaint submission if rewards update fails
    }

    // Return with the created complaint ID
    return NextResponse.json({
      message: "Complaint created successfully",
      complaintId: result.insertedId,
      complaint: {
        ...complaint,
        _id: result.insertedId
      }
    });
  } catch (error) {
    console.error("Error creating complaint:", error);
    return NextResponse.json(
      { error: "Failed to create complaint" },
      { status: 500 }
    );
  }
} 