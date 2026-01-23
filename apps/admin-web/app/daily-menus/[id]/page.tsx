'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../../components/protected-route';
import { UserRole } from '@contracts/core';
import { Loading } from '../../../components/ui/loading';
import { apiClient } from '../../../lib/api-client';

export default function DailyMenuEditorPage() {
  const params = useParams();
  const router = useRouter();
  const dailyMenuId = params.id as string;

  useEffect(() => {
    // Load the menu to get its date, then redirect to main page with that date selected
    const redirectToMainPage = async () => {
      try {
        const menu = await apiClient.getDailyMenuById(dailyMenuId);
        // Redirect to main page - the main page will handle selecting the correct date
        router.replace('/');
      } catch (error) {
        // If menu not found, just redirect to main page
        router.replace('/');
      }
    };

    if (dailyMenuId) {
      redirectToMainPage();
    } else {
      router.replace('/');
    }
  }, [dailyMenuId, router]);

  return (
    <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading message="Redirecting..." />
      </div>
    </ProtectedRoute>
  );
}
