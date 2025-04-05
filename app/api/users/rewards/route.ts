import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Interface for user rewards
interface UserReward {
  _id?: string;
  userId: string;
  points: number;
  level: number;
  badges: {
    id: string;
    name: string;
    description: string;
    category: string;
    unlocked: boolean;
    unlockedAt?: Date;
    progress?: number;
  }[];
  stats: {
    totalComplaints: number;
    completedComplaints: number;
    pendingComplaints: number;
    votes: number;
    comments: number;
  };
  updatedAt: Date;
}

// Calculate level based on points
const calculateLevel = (points: number): number => {
  // Simple level calculation: Level 1 = 0-99 points, Level 2 = 100-199 points, etc.
  return Math.floor(points / 100) + 1;
};

// Get user rewards or initialize if not present
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in to access rewards" },
        { status: 401 }
      );
    }

    try {
      const { db } = await connectToDatabase();
      const rewardsCollection = db.collection("rewards");

      let userRewards = await rewardsCollection.findOne({ userId: user.id });

      if (!userRewards) {
        // Initialize rewards for a new user
        const defaultBadges = [
          {
            id: 'newcomer',
            name: 'Newcomer',
            description: 'Welcome to CivicSync!',
            category: 'engagement',
            unlocked: true,
            unlockedAt: new Date(),
            progress: 100
          },
          {
            id: 'first-complaint',
            name: 'First Report',
            description: 'You submitted your first complaint',
            category: 'complaints',
            unlocked: false,
            progress: 0
          },
          {
            id: 'resolution-pioneer',
            name: 'Resolution Pioneer',
            description: 'You had your first complaint resolved',
            category: 'complaints',
            unlocked: false,
            progress: 0
          },
          {
            id: 'active-citizen',
            name: 'Active Citizen',
            description: 'Submit 5 complaints',
            category: 'complaints',
            unlocked: false,
            progress: 0
          },
          {
            id: 'feedback-provider',
            name: 'Feedback Provider',
            description: 'Leave 5 comments on complaints',
            category: 'community',
            unlocked: false,
            progress: 0
          },
          {
            id: 'problem-solver',
            name: 'Problem Solver',
            description: 'Get 10 complaints resolved',
            category: 'complaints',
            unlocked: false,
            progress: 0
          },
          {
            id: 'community-pillar',
            name: 'Community Pillar',
            description: 'Receive 50 votes across all your complaints',
            category: 'community',
            unlocked: false,
            progress: 0
          },
          {
            id: 'top-reporter',
            name: 'Top Reporter',
            description: 'Be in the top 10% of reporters in your area',
            category: 'engagement',
            unlocked: false,
            progress: 0
          },
        ];

        // Create initial rewards document
        const initialRewards: UserReward = {
          userId: user.id,
          points: 25, // Starting points for new users
          level: 1,
          badges: defaultBadges,
          stats: {
            totalComplaints: 0,
            completedComplaints: 0,
            pendingComplaints: 0,
            votes: 0,
            comments: 0,
          },
          updatedAt: new Date(),
        };

        try {
          await rewardsCollection.insertOne(initialRewards);
          userRewards = initialRewards;
        } catch (dbInsertError) {
          console.error("Error creating initial rewards:", dbInsertError);
          // Still return a valid response with initial rewards data
          userRewards = initialRewards;
        }
      }

      const level = calculateLevel(userRewards.points);
      const nextLevelPoints = level * 100;

      return NextResponse.json({
        rewards: userRewards,
        nextLevelPoints,
        success: true,
        message: "Rewards data retrieved successfully"
      });
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      // Return a more detailed error response with HTTP 500 but not a format that would trigger navigation
      return NextResponse.json(
        { 
          error: "Database connection failed", 
          message: "We're having trouble connecting to the database. Please try again later.",
          success: false,
          // Include fallback data to prevent UI errors
          fallbackData: {
            rewards: {
              userId: user.id,
              points: 25,
              level: 1,
              badges: [
                {
                  id: 'newcomer',
                  name: 'Newcomer',
                  description: 'Welcome to CivicSync!',
                  category: 'engagement',
                  unlocked: true,
                  unlockedAt: new Date(),
                  progress: 100
                }
              ],
              stats: {
                totalComplaints: 0,
                completedComplaints: 0,
                pendingComplaints: 0,
                votes: 0,
                comments: 0,
              }
            },
            nextLevelPoints: 100
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching user rewards:", error);
    // Return a more user-friendly error with fallback data
    return NextResponse.json(
      { 
        error: "Failed to fetch rewards", 
        message: "We couldn't retrieve your rewards data at this time.",
        success: false,
        // Include fallback data to prevent UI errors
        fallbackData: {
          rewards: {
            points: 0,
            level: 1,
            badges: [],
            stats: {
              totalComplaints: 0,
              completedComplaints: 0,
              pendingComplaints: 0,
              votes: 0,
              comments: 0,
            }
          },
          nextLevelPoints: 100
        }
      },
      { status: 500 }
    );
  }
}

// Update user rewards
export async function PATCH(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          message: "You must be logged in to update rewards",
          success: false 
        },
        { status: 401 }
      );
    }

    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return NextResponse.json(
        { 
          error: "Invalid request data", 
          message: "The request data could not be parsed as JSON",
          success: false 
        },
        { status: 400 }
      );
    }
    
    const { action, value, badgeId } = requestData;

    if (!action) {
      return NextResponse.json(
        { 
          error: "Missing required fields", 
          message: "The 'action' field is required",
          success: false 
        },
        { status: 400 }
      );
    }

    try {
      const { db } = await connectToDatabase();
      const rewardsCollection = db.collection("rewards");
      const complaintsCollection = db.collection("complaints");
      const commentsCollection = db.collection("comments");
      
      let userRewards = await rewardsCollection.findOne({ userId: user.id });
      
      if (!userRewards) {
        // Instead of 404, create new rewards
        console.log("User rewards not found, creating initial rewards");
        const defaultBadges = [
          {
            id: 'newcomer',
            name: 'Newcomer',
            description: 'Welcome to CivicSync! You\'ve joined the community',
            category: 'engagement',
            unlocked: true,
            unlockedAt: new Date(),
            progress: 100
          },
          // Add other default badges
        ];

        userRewards = {
          userId: user.id,
          points: 25,
          level: 1,
          badges: defaultBadges,
          stats: {
            totalComplaints: 0,
            completedComplaints: 0,
            pendingComplaints: 0,
            votes: 0,
            comments: 0,
          },
          updatedAt: new Date(),
        };

        try {
          await rewardsCollection.insertOne(userRewards);
        } catch (insertError) {
          console.error("Failed to create initial rewards:", insertError);
          // Continue with the in-memory rewards object
        }
      }

      let pointsToAdd = 0;
      let newAchievement = null;
      const updatedRewards = { ...userRewards };
      const updatedStats = { ...userRewards.stats };
      const updatedBadges = [...userRewards.badges];

      // Process the action
      switch (action) {
        case "ADD_POINTS":
          pointsToAdd = value || 0;
          console.log(`Adding ${pointsToAdd} points directly to user ${user.id}`);
          break;
          
        case "SUBMITTED_COMPLAINT":
          // Add points for submitting a complaint
          pointsToAdd = 15;
          console.log(`User ${user.id} submitted a complaint: +${pointsToAdd} points`);
          
          updatedStats.totalComplaints++;
          updatedStats.pendingComplaints++;
          console.log(`Updated stats: Total complaints: ${updatedStats.totalComplaints}, Pending: ${updatedStats.pendingComplaints}`);
          
          // Check for badge unlocks
          if (updatedStats.totalComplaints === 1) {
            const badgeIndex = updatedBadges.findIndex(b => b.id === 'first-complaint');
            if (badgeIndex !== -1 && !updatedBadges[badgeIndex].unlocked) {
              updatedBadges[badgeIndex].unlocked = true;
              updatedBadges[badgeIndex].unlockedAt = new Date();
              updatedBadges[badgeIndex].progress = 100;
              pointsToAdd += 25; // Bonus for badge
              newAchievement = updatedBadges[badgeIndex];
              console.log(`Unlocked "First Complaint" badge: +25 bonus points`);
            }
          }
          
          if (updatedStats.totalComplaints >= 5) {
            const badgeIndex = updatedBadges.findIndex(b => b.id === 'active-citizen');
            if (badgeIndex !== -1 && !updatedBadges[badgeIndex].unlocked) {
              updatedBadges[badgeIndex].unlocked = true;
              updatedBadges[badgeIndex].unlockedAt = new Date();
              updatedBadges[badgeIndex].progress = 100;
              pointsToAdd += 50; // Bonus for badge
              newAchievement = updatedBadges[badgeIndex];
            }
          } else if (updatedStats.totalComplaints < 5) {
            // Update progress
            const badgeIndex = updatedBadges.findIndex(b => b.id === 'active-citizen');
            if (badgeIndex !== -1) {
              updatedBadges[badgeIndex].progress = Math.min(
                Math.floor((updatedStats.totalComplaints / 5) * 100),
                99 // Cap at 99% until fully unlocked
              );
            }
          }
          break;
          
        case "COMPLAINT_RESOLVED":
          // Add points for having a complaint resolved
          pointsToAdd = 40;
          updatedStats.completedComplaints++;
          updatedStats.pendingComplaints = Math.max(0, updatedStats.pendingComplaints - 1);
          
          // Check for badge unlocks
          if (updatedStats.completedComplaints === 1) {
            const badgeIndex = updatedBadges.findIndex(b => b.id === 'resolution-pioneer');
            if (badgeIndex !== -1 && !updatedBadges[badgeIndex].unlocked) {
              updatedBadges[badgeIndex].unlocked = true;
              updatedBadges[badgeIndex].unlockedAt = new Date();
              updatedBadges[badgeIndex].progress = 100;
              pointsToAdd += 25; // Bonus for badge
              newAchievement = updatedBadges[badgeIndex];
            }
          }
          
          if (updatedStats.completedComplaints >= 10) {
            const badgeIndex = updatedBadges.findIndex(b => b.id === 'problem-solver');
            if (badgeIndex !== -1 && !updatedBadges[badgeIndex].unlocked) {
              updatedBadges[badgeIndex].unlocked = true;
              updatedBadges[badgeIndex].unlockedAt = new Date();
              updatedBadges[badgeIndex].progress = 100;
              pointsToAdd += 75; // Bonus for badge
              newAchievement = updatedBadges[badgeIndex];
            }
          } else if (updatedStats.completedComplaints < 10) {
            // Update progress
            const badgeIndex = updatedBadges.findIndex(b => b.id === 'problem-solver');
            if (badgeIndex !== -1) {
              updatedBadges[badgeIndex].progress = Math.min(
                Math.floor((updatedStats.completedComplaints / 10) * 100),
                99 // Cap at 99% until fully unlocked
              );
            }
          }
          break;
          
        case "ADDED_COMMENT":
          // Add points for adding a comment
          pointsToAdd = 5;
          updatedStats.comments++;
          
          // Check for badge unlocks
          if (updatedStats.comments >= 5) {
            const badgeIndex = updatedBadges.findIndex(b => b.id === 'feedback-provider');
            if (badgeIndex !== -1 && !updatedBadges[badgeIndex].unlocked) {
              updatedBadges[badgeIndex].unlocked = true;
              updatedBadges[badgeIndex].unlockedAt = new Date();
              updatedBadges[badgeIndex].progress = 100;
              pointsToAdd += 25; // Bonus for badge
              newAchievement = updatedBadges[badgeIndex];
            }
          } else if (updatedStats.comments < 5) {
            // Update progress
            const badgeIndex = updatedBadges.findIndex(b => b.id === 'feedback-provider');
            if (badgeIndex !== -1) {
              updatedBadges[badgeIndex].progress = Math.min(
                Math.floor((updatedStats.comments / 5) * 100),
                99 // Cap at 99% until fully unlocked
              );
            }
          }
          break;
          
        case "RECEIVED_VOTE":
          // Add points for receiving a vote
          pointsToAdd = 2;
          updatedStats.votes++;
          
          // Check for badge unlocks
          if (updatedStats.votes >= 50) {
            const badgeIndex = updatedBadges.findIndex(b => b.id === 'community-pillar');
            if (badgeIndex !== -1 && !updatedBadges[badgeIndex].unlocked) {
              updatedBadges[badgeIndex].unlocked = true;
              updatedBadges[badgeIndex].unlockedAt = new Date();
              updatedBadges[badgeIndex].progress = 100;
              pointsToAdd += 50; // Bonus for badge
              newAchievement = updatedBadges[badgeIndex];
            }
          } else if (updatedStats.votes < 50) {
            // Update progress
            const badgeIndex = updatedBadges.findIndex(b => b.id === 'community-pillar');
            if (badgeIndex !== -1) {
              updatedBadges[badgeIndex].progress = Math.min(
                Math.floor((updatedStats.votes / 50) * 100),
                99 // Cap at 99% until fully unlocked
              );
            }
          }
          break;
          
        case "UPDATE_STATS":
          // Comprehensive update based on actual database data
          // Count user's complaints
          const totalComplaints = await complaintsCollection.countDocuments({ userId: user.id });
          const completedComplaints = await complaintsCollection.countDocuments({ 
            userId: user.id, 
            status: "completed" 
          });
          
          // Count user's comments
          const comments = await commentsCollection.countDocuments({ userId: user.id });
          
          // Count votes across all complaints
          const userComplaints = await complaintsCollection.find({ userId: user.id }).toArray();
          const complaintIds = userComplaints.map(c => c._id);
          
          let totalVotes = 0;
          userComplaints.forEach(complaint => {
            totalVotes += complaint.votes || 0;
          });
          
          updatedStats.totalComplaints = totalComplaints;
          updatedStats.completedComplaints = completedComplaints;
          updatedStats.pendingComplaints = totalComplaints - completedComplaints;
          updatedStats.votes = totalVotes;
          updatedStats.comments = comments;
          
          // Update badge progress based on stats
          updatedBadges.forEach((badge, index) => {
            switch (badge.id) {
              case 'first-complaint':
                if (totalComplaints >= 1) {
                  updatedBadges[index].unlocked = true;
                  updatedBadges[index].progress = 100;
                } else {
                  updatedBadges[index].progress = 0;
                }
                break;
                
              case 'active-citizen':
                if (totalComplaints >= 5) {
                  updatedBadges[index].unlocked = true;
                  updatedBadges[index].progress = 100;
                } else {
                  updatedBadges[index].progress = Math.floor((totalComplaints / 5) * 100);
                }
                break;
                
              case 'resolution-pioneer':
                if (completedComplaints >= 1) {
                  updatedBadges[index].unlocked = true;
                  updatedBadges[index].progress = 100;
                } else {
                  updatedBadges[index].progress = 0;
                }
                break;
                
              case 'problem-solver':
                if (completedComplaints >= 10) {
                  updatedBadges[index].unlocked = true;
                  updatedBadges[index].progress = 100;
                } else {
                  updatedBadges[index].progress = Math.floor((completedComplaints / 10) * 100);
                }
                break;
                
              case 'feedback-provider':
                if (comments >= 5) {
                  updatedBadges[index].unlocked = true;
                  updatedBadges[index].progress = 100;
                } else {
                  updatedBadges[index].progress = Math.floor((comments / 5) * 100);
                }
                break;
                
              case 'community-pillar':
                if (totalVotes >= 50) {
                  updatedBadges[index].unlocked = true;
                  updatedBadges[index].progress = 100;
                } else {
                  updatedBadges[index].progress = Math.floor((totalVotes / 50) * 100);
                }
                break;
            }
          });
          break;
          
        case "UNLOCK_BADGE":
          if (!badgeId) {
            return NextResponse.json(
              { error: "Badge ID required for unlocking" },
              { status: 400 }
            );
          }
          
          const badgeIndex = updatedBadges.findIndex(b => b.id === badgeId);
          if (badgeIndex === -1) {
            return NextResponse.json(
              { error: "Badge not found" },
              { status: 404 }
            );
          }
          
          if (!updatedBadges[badgeIndex].unlocked) {
            updatedBadges[badgeIndex].unlocked = true;
            updatedBadges[badgeIndex].unlockedAt = new Date();
            updatedBadges[badgeIndex].progress = 100;
            
            // Assign points based on badge type
            switch (badgeId) {
              case 'newcomer':
                pointsToAdd = 10;
                break;
              case 'first-complaint':
              case 'resolution-pioneer':
              case 'feedback-provider':
                pointsToAdd = 25;
                break;
              case 'active-citizen':
              case 'community-pillar':
                pointsToAdd = 50;
                break;
              case 'problem-solver':
              case 'top-reporter':
                pointsToAdd = 75;
                break;
              default:
                pointsToAdd = 20;
            }
            
            newAchievement = updatedBadges[badgeIndex];
          }
          break;
          
        default:
          return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
          );
      }

      // Update user rewards
      const updatedPoints = userRewards.points + pointsToAdd;
      const updatedLevel = calculateLevel(updatedPoints);
      const levelUp = updatedLevel > userRewards.level;
      
      console.log(`Updating user ${user.id} rewards - Current: ${userRewards.points}, Adding: ${pointsToAdd}, New total: ${updatedPoints}`);
      if (levelUp) {
        console.log(`User leveled up from ${userRewards.level} to ${updatedLevel}!`);
      }

      const update = {
        $set: {
          points: updatedPoints,
          level: updatedLevel,
          badges: updatedBadges,
          stats: updatedStats,
          updatedAt: new Date()
        }
      };

      try {
        const updateResult = await rewardsCollection.updateOne({ userId: user.id }, update, { upsert: true });
        console.log(`Database update result: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}, upserted=${updateResult.upsertedCount}`);
      } catch (updateError) {
        console.error("Error updating rewards in database:", updateError);
        // We'll still return the calculated data but with a warning
        return NextResponse.json({
          rewards: {
            ...userRewards,
            points: updatedPoints,
            level: updatedLevel,
            badges: updatedBadges,
            stats: updatedStats
          },
          pointsAdded: pointsToAdd,
          levelUp,
          nextLevelPoints: updatedLevel * 100,
          newAchievement,
          warning: "Changes may not have been saved to the database",
          success: true
        });
      }

      const nextLevelPoints = updatedLevel * 100;

      return NextResponse.json({
        rewards: {
          ...userRewards,
          points: updatedPoints,
          level: updatedLevel,
          badges: updatedBadges,
          stats: updatedStats
        },
        pointsAdded: pointsToAdd,
        levelUp,
        nextLevelPoints,
        newAchievement,
        success: true,
        message: "Rewards updated successfully"
      });
    } catch (dbError) {
      console.error("Database error while updating rewards:", dbError);
      return NextResponse.json(
        { 
          error: "Database connection failed", 
          message: "We're having trouble connecting to the database. Please try again later.",
          success: false,
          // Return the original rewards to prevent UI errors
          fallbackData: userRewards || { points: 0, level: 1, badges: [] }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating rewards:", error);
    return NextResponse.json(
      { 
        error: "Failed to update rewards", 
        message: "We couldn't update your rewards at this time.",
        success: false 
      },
      { status: 500 }
    );
  }
} 