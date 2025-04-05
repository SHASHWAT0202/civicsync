import { toast } from "react-hot-toast";

/**
 * Safely handle API response errors
 * @param response - The fetch response object
 * @param errorMessage - Default error message to display
 * @returns Object with error info and whether to continue processing
 */
export async function handleApiResponse(response: Response, errorMessage: string = "An error occurred") {
  if (!response.ok) {
    // Try to get detailed error message from response
    let errorDetails = "";
    try {
      const errorData = await response.json();
      errorDetails = errorData.message || errorData.error || "";
    } catch (e) {
      try {
        errorDetails = await response.text();
      } catch (textError) {
        console.error("Could not parse error response", textError);
      }
    }
    
    // Log the error with status code
    console.error(`API Error (${response.status}):`, errorDetails || errorMessage);
    
    // Show toast with appropriate message
    const displayMessage = errorDetails || errorMessage;
    toast.error(displayMessage);
    
    return {
      success: false,
      status: response.status,
      message: displayMessage,
      continue: false
    };
  }
  
  return {
    success: true,
    status: response.status,
    continue: true
  };
}

/**
 * Safely parse JSON response with error handling
 * @param response - The fetch response
 * @returns Parsed data or null on error
 */
export async function safelyParseJson<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("Error parsing JSON response:", error);
    toast.error("Failed to parse response data");
    return null;
  }
}

/**
 * Handle fetch errors uniformly
 * @param error - The error object
 * @param errorMessage - User-friendly error message
 */
export function handleFetchError(error: unknown, errorMessage: string = "Network error") {
  console.error(errorMessage, error);
  toast.error(errorMessage);
}

/**
 * Create a fallback object with default values when data fetching fails
 * @param defaultValues - Object with default values
 * @returns A function that returns the fallback object
 */
export function createFallback<T>(defaultValues: T) {
  return () => defaultValues;
}

/**
 * Handle errors in API routes
 * @param error - The error object
 * @param defaultMessage - Default error message
 * @returns Object with error details formatted for API response
 */
export function formatApiError(error: unknown, defaultMessage: string = "Internal server error") {
  console.error("API Error:", error);
  
  let message = defaultMessage;
  let status = 500;
  
  if (error instanceof Error) {
    message = error.message;
  }
  
  // Handle specific error types
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;
    if (errorObj.status) {
      status = errorObj.status;
    }
    if (errorObj.message) {
      message = errorObj.message;
    }
  }
  
  return {
    error: true,
    message,
    status
  };
}

/**
 * Create a standard error response for API routes
 * @param message - Error message
 * @param status - HTTP status code
 * @param fallbackData - Optional fallback data to include
 * @returns Formatted error response
 */
export function createErrorResponse(message: string, status: number = 500, fallbackData?: any) {
  const response = {
    error: true,
    message,
    success: false,
    ...(fallbackData ? { fallbackData } : {})
  };
  
  return response;
}

/**
 * Determine if an error should cause a navigation to error page
 * Based on status code and error type
 * @param status - HTTP status code
 * @param error - Error object or message
 * @returns Boolean indicating if navigation is needed
 */
export function shouldNavigateToErrorPage(status: number, error: any): boolean {
  // Never navigate for these status codes
  if ([400, 401, 403, 409, 422].includes(status)) {
    return false;
  }
  
  // Always navigate for these status codes unless specified otherwise
  if ([404, 500, 502, 503, 504].includes(status)) {
    // Check if error has a specific flag
    if (error && typeof error === 'object' && 'preventNavigation' in error) {
      return !error.preventNavigation;
    }
    return true;
  }
  
  return false;
} 