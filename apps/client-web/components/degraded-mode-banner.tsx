'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api-client';

export function DegradedModeBanner() {
  const [isDegraded, setIsDegraded] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        setIsChecking(true);
        // Try a simple health check
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        
        if (!response.ok) {
          setIsDegraded(true);
        } else {
          setIsDegraded(apiClient.isDegradedMode());
        }
      } catch (error) {
        setIsDegraded(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkBackend();
    // Check every 30 seconds
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isChecking || !isDegraded) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff3cd',
        color: '#856404',
        padding: '0.75rem 1rem',
        borderBottom: '2px solid #ffc107',
        zIndex: 1000,
        textAlign: 'center',
        fontSize: '0.9rem',
        fontWeight: '500',
      }}
    >
      ⚠️ Backend is currently unavailable. You are viewing cached data. New orders cannot be placed at this time.
    </div>
  );
}
