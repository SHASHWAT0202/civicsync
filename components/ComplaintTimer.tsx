"use client";

import { useState, useEffect } from 'react';

interface ComplaintTimerProps {
  createdAt: string;
  complaintId: string;
  onLongDuration?: (duration: number) => void;
}

export default function ComplaintTimer({ createdAt, complaintId, onLongDuration }: ComplaintTimerProps) {
  const [duration, setDuration] = useState<string>('');
  const [isLongDuration, setIsLongDuration] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

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
  }, [createdAt, complaintId, onLongDuration, isLongDuration, isMounted]);

  // Return static content during SSR or before hydration
  if (!isMounted) {
    return <div className="text-sm text-gray-600">Loading...</div>;
  }

  return (
    <div className={`text-sm ${isLongDuration ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
      {duration}
    </div>
  );
} 