'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loading } from '../../../components/ui/loading';
import { apiClient } from '../../../lib/api-client';

export default function MenuDetailPage() {
  const params = useParams();
  const router = useRouter();
  const menuId = params.id as string;

  useEffect(() => {
    // Load the menu to get its date, then redirect to menus page with that date selected
    const redirectToMenusPage = async () => {
      try {
        const menu = await apiClient.getDailyMenuById(menuId);
        // Redirect to menus page - the menus page will handle selecting the correct date
        router.replace(`/menus?date=${menu.date}`);
      } catch (error) {
        // If menu not found, just redirect to menus page
        router.replace('/menus');
      }
    };

    if (menuId) {
      redirectToMenusPage();
    } else {
      router.replace('/menus');
    }
  }, [menuId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loading message="Redirecting..." />
    </div>
  );
}
