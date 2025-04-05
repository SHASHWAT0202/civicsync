import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Connect to the database and find user
    const { db } = await connectToDatabase();
    
    // Find user in the database
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json(
        { role: "user" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { role: user.role || "user" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking user role:", error);
    return NextResponse.json(
      { error: "Failed to check user role" },
      { status: 500 }
    );
  }
} 