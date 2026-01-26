'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';
import { MealDto, CreateMealDto } from '@contracts/core';

export function useMeals() {
  const [meals, setMeals] = useState<MealDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMeals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getMeals();
      setMeals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load meals');
    } finally {
      setLoading(false);
    }
  }, []);

  const createMeal = useCallback(async (data: CreateMealDto) => {
    try {
      setError('');
      await apiClient.createMeal(data);
      await loadMeals();
    } catch (err: any) {
      setError(err.message || 'Failed to create meal');
      throw err;
    }
  }, [loadMeals]);

  return {
    meals,
    loading,
    error,
    loadMeals,
    createMeal,
    setError,
  };
}
