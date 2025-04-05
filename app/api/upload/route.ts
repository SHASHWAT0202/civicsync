import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with proper environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }
    
    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported. Please upload a JPEG, PNG or GIF image." },
        { status: 400 }
      );
    }
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert buffer to base64
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;
    
    // Upload to Cloudinary with proper error handling
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          dataURI,
          {
            folder: "civicsync",
            resource_type: "image",
            // Add timestamp to avoid caching issues
            public_id: `complaint_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
      });
      
      // Ensure the result is properly typed and contains expected properties
      if (!result || typeof result !== 'object' || !result.secure_url) {
        throw new Error("Invalid response from Cloudinary");
      }
      
      return NextResponse.json(result);
    } catch (cloudinaryError) {
      console.error("Cloudinary upload failed:", cloudinaryError);
      return NextResponse.json(
        { 
          error: "Failed to upload to Cloudinary", 
          details: cloudinaryError.message || "Unknown cloudinary error" 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { 
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 