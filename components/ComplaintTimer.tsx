"use client";

import { useState, useEffect } from 'react';

interface ComplaintTimerProps {
  createdAt: string;
  complaintId: string;
  status: string;
  updatedAt?: string;
  onLongDuration?: (duration: number) => void;
}

export default function ComplaintTimer({ createdAt, complaintId, status, updatedAt, onLongDuration }: ComplaintTimerProps) {
  const [duration, setDuration] = useState<string>('');
  const [isLongDuration, setIsLongDuration] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isActive = status !== 'completed' && status !== 'rejected';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !isActive) return;

    const calculateDuration = () => {
      const created = new Date(createdAt);
      const now = new Date();
      const diffInMs = now.getTime() - created.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      const diffInHours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffInMinutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffInSeconds = Math.floor((diffInMs % (1000 * 60)) / 1000);

      let durationStr = '';
      if (diffInDays > 0) durationStr += `${diffInDays}d `;
      if (diffInHours > 0) durationStr += `${diffInHours}h `;
      if (diffInMinutes > 0) durationStr += `${diffInMinutes}m `;
      durationStr += `${diffInSeconds}s`;

      setDuration(durationStr);

      // Check if complaint is taking too long (more than 7 days)
      if (diffInDays >= 7 && !isLongDuration) {
        setIsLongDuration(true);
        onLongDuration?.(diffInDays);
      }
    };

    // Calculate initial duration
    calculateDuration();

    // Update every second
    const interval = setInterval(calculateDuration, 1000);

    return () => clearInterval(interval);
  }, [createdAt, complaintId, onLongDuration, isLongDuration, isMounted, isActive]);

  // Return static content during SSR or before hydration
  if (!isMounted) {
    return <div className="text-sm text-gray-600">Loading...</div>;
  }

  // If complaint is completed or rejected, show resolved time instead of timer
  if (!isActive && updatedAt) {
    const created = new Date(createdAt);
    const resolved = new Date(updatedAt);
    const diffInMs = resolved.getTime() - created.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    let resolvedTime = '';
    if (diffInDays > 0) resolvedTime += `${diffInDays}d `;
    if (diffInHours > 0) resolvedTime += `${diffInHours}h`;

    return (
      <div className="text-sm text-gray-600">
        {status === 'completed' ? 'Resolved in: ' : 'Closed in: '}
        <span className="font-medium">{resolvedTime || 'Less than 1 hour'}</span>
      </div>
    );
  }

  return (
    <div className={`text-sm ${isLongDuration ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
      {duration}
    </div>
  );
} 