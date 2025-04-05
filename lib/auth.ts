import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * Gets the current user from Clerk
 */
export async function getUser() {
  return await currentUser();
}

/**
 * Gets the current user ID from Clerk
 */
export async function getUserId() {
  const user = await currentUser();
  return user?.id;
}

/**
 * Checks if the current user is authenticated
 */
export async function isAuthenticated() {
  const user = await currentUser();
  return !!user;
}

/**
 * Checks if the current user is an admin
 */
export async function isAdmin() {
  const user = await currentUser();
  
  if (!user) return false;
  
  const { db } = await connectToDatabase();
  const dbUser = await db.collection("users").findOne({ clerkId: user.id });
  
  return dbUser?.role === "admin";
} 