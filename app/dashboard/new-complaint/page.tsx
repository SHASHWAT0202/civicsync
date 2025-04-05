"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import MainLayout from "@/components/MainLayout";
import { toast } from "react-hot-toast";
import { ComplaintCategory } from "@/types";

export default function NewComplaintPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "potholes" as ComplaintCategory,
    location: {
      lat: 0,
      lng: 0,
      address: "",
    },
  });
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [locationError, setLocationError] = useState("");

  // Get current location when component mounts
  const getCurrentLocation = () => {
    setLocationError("");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Try to get address from coordinates
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            const address = data.display_name || "";
            
            setFormData((prev) => ({
              ...prev,
              location: {
                lat: latitude,
                lng: longitude,
                address,
              },
            }));
          } catch (error) {
            console.error("Error fetching address:", error);
            setFormData((prev) => ({
              ...prev,
              location: {
                lat: latitude,
                lng: longitude,
                address: "",
              },
            }));
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("Failed to get your location. Please enter it manually.");
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === "lat" || name === "lng") {
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [name]: parseFloat(value) || 0,
        },
      }));
    } else if (name === "address") {
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          address: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Limit to 5 images
      if (images.length + selectedFiles.length > 5) {
        toast.error("You can upload a maximum of 5 images");
        return;
      }
      
      // Check file size (limit to 5MB each)
      const oversizedFiles = selectedFiles.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error("Some files are too large. Maximum size is 5MB per image");
        return;
      }
      
      // Create preview URLs
      const newImageUrls = selectedFiles.map(file => URL.createObjectURL(file));
      
      setImages(prev => [...prev, ...selectedFiles]);
      setImageUrls(prev => [...prev, ...newImageUrls]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imageUrls[index]);
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (images.length === 0) {
      toast.error("Please upload at least one image for your complaint");
      return [];
    }
    
    const uploadedImageUrls: string[] = [];
    let failedUploads = 0;
    
    // Create a toast for upload progress
    const toastId = toast.loading(`Uploading images (0/${images.length})...`);
    
    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const formData = new FormData();
        formData.append("file", image);
        
        toast.loading(`Uploading images (${i+1}/${images.length})...`, { id: toastId });
        
        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          
          // For debugging
          console.log(`Image ${i+1} upload response status:`, response.status);
          
          if (!response.ok) {
            failedUploads++;
            const errorText = await response.text();
            console.error(`Failed to upload image ${i+1}:`, errorText);
            continue; // Skip to next image
          }
          
          const data = await response.json();
          console.log(`Image ${i+1} upload success:`, data);
          
          if (data && data.secure_url) {
            uploadedImageUrls.push(data.secure_url);
          } else {
            console.error("Invalid response from upload API:", data);
            failedUploads++;
          }
        } catch (error) {
          console.error(`Error uploading image ${i+1}:`, error);
          failedUploads++;
        }
      }
    } catch (error) {
      console.error("Fatal error during image upload:", error);
      toast.error("An unexpected error occurred while uploading images", { id: toastId });
      return [];
    }
    
    // Update the toast based on results
    if (failedUploads === 0) {
      toast.success(`All ${images.length} images uploaded successfully`, { id: toastId });
    } else if (failedUploads < images.length) {
      toast.warning(`${images.length - failedUploads} of ${images.length} images uploaded`, { id: toastId });
    } else {
      toast.error("Failed to upload any images", { id: toastId });
    }
    
    return uploadedImageUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !isSignedIn) {
      toast.error("You must be signed in to submit a complaint");
      return;
    }
    
    // Validate form
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    
    if (formData.location.lat === 0 && formData.location.lng === 0) {
      toast.error("Please provide a location");
      return;
    }
    
    // Check if at least one image is uploaded - make it compulsory
    if (images.length === 0) {
      toast.error("Please upload at least one image for your complaint");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const submissionToastId = toast.loading("Submitting complaint...");
      
      // Upload images first
      const uploadedImageUrls = await uploadImages();
      
      // Verify that at least one image was successfully uploaded
      if (uploadedImageUrls.length === 0) {
        toast.error("Failed to upload images. Please try again.", { id: submissionToastId });
        setIsSubmitting(false);
        return;
      }
      
      // Submit complaint
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          images: uploadedImageUrls,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.error || "Failed to submit complaint";
        console.error("Error submitting complaint:", errorMsg);
        toast.error(errorMsg, { id: submissionToastId });
        return;
      }
      
      toast.success("Complaint submitted successfully", { id: submissionToastId });
      
      // Add notification about potential badge rewards
      setTimeout(() => {
        toast.success(
          "You may have earned engagement badges! Check your profile.",
          { duration: 5000, icon: "🏆" }
        );
      }, 2000);
      
      // Navigate to the complaint details page
      if (data.complaint && data.complaint._id) {
        router.push(`/dashboard/complaints/${data.complaint._id}`);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error("Failed to submit complaint");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Loading...</h1>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-blue-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Submit a New Complaint</h1>
          <p className="mt-2 text-blue-100">
            Report an issue in your community
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      placeholder="Brief title describing the issue"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <div className="mt-1">
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      required
                    >
                      <option value="potholes">Potholes</option>
                      <option value="road-breaks">Road Breaks</option>
                      <option value="sewer-issues">Sewer Issues</option>
                      <option value="water-supply">Water Supply</option>
                      <option value="electricity">Electricity</option>
                      <option value="garbage">Garbage</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      placeholder="Detailed description of the issue"
                      required
                    ></textarea>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="lat" className="block text-xs text-gray-600">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="lat"
                        id="lat"
                        value={formData.location.lat || ""}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="lng" className="block text-xs text-gray-600">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="lng"
                        id="lng"
                        value={formData.location.lng || ""}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label htmlFor="address" className="block text-xs text-gray-600">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={formData.location.address}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      placeholder="Street address or location description"
                    />
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Use My Current Location
                    </button>
                    {locationError && (
                      <p className="mt-1 text-sm text-red-600">{locationError}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Images
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-700">
                        <label
                          htmlFor="images"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload images</span>
                          <input
                            id="images"
                            name="images"
                            type="file"
                            accept="image/*"
                            multiple
                            className="sr-only"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1 text-gray-700">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-600">
                        PNG, JPG, GIF up to 5MB (max 5 images)
                      </p>
                    </div>
                  </div>
                  {imageUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="h-24 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Complaint"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 