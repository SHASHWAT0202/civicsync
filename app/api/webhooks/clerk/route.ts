import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { sendRegistrationEmail } from "@/lib/email";

// This is the Clerk webhook handler that syncs user data with our database
export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", {
      status: 400,
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with ID: ${id} and type: ${eventType}`);
  console.log("Webhook body:", body);

  // Handle the webhook
  try {
    const { db } = await connectToDatabase();

    if (eventType === "user.created") {
      // Extract user data from the webhook payload
      const { id: clerkId, email_addresses, first_name, last_name } = evt.data;
      
      // Get the primary email
      const primaryEmail = email_addresses?.find(email => email.id === evt.data.primary_email_address_id);
      
      if (!primaryEmail) {
        console.error("No primary email found for user:", clerkId);
        return NextResponse.json({ error: "No primary email found" }, { status: 400 });
      }

      // Create a new user in our database
      const newUser = {
        clerkId,
        email: primaryEmail.email_address,
        firstName: first_name || "",
        lastName: last_name || "",
        role: "user", // Default role
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.collection("users").insertOne(newUser);
      console.log("User created in database:", clerkId);
      
      // Send welcome email to the user
      try {
        await sendRegistrationEmail(
          primaryEmail.email_address,
          `${first_name || ''} ${last_name || ''}`.trim() || 'CivicSync User'
        );
        console.log("Registration email sent to:", primaryEmail.email_address);
      } catch (emailError) {
        // Don't fail the request if email sending fails
        console.error("Failed to send registration email:", emailError);
      }
    } 
    else if (eventType === "user.updated") {
      // Extract user data from the webhook payload
      const { id: clerkId, email_addresses, first_name, last_name } = evt.data;
      
      // Get the primary email
      const primaryEmail = email_addresses?.find(email => email.id === evt.data.primary_email_address_id);
      
      if (!primaryEmail) {
        console.error("No primary email found for user:", clerkId);
        return NextResponse.json({ error: "No primary email found" }, { status: 400 });
      }

      // Update the user in our database
      const updateData = {
        email: primaryEmail.email_address,
        firstName: first_name || "",
        lastName: last_name || "",
        updatedAt: new Date().toISOString(),
      };

      await db.collection("users").updateOne(
        { clerkId },
        { $set: updateData }
      );
      console.log("User updated in database:", clerkId);
    }
    else if (eventType === "user.deleted") {
      // Delete the user from our database
      await db.collection("users").deleteOne({ clerkId: id });
      console.log("User deleted from database:", id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 