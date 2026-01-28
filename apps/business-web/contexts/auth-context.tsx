'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserDto, UserRole, LoginRequestDto } from '@contracts/core';
import { apiClient } from '../lib/api-client';

interface AuthContextType {
  user: UserDto | null;
  loading: boolean;
  login: (credentials: LoginRequestDto) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isBusinessAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await apiClient.getCurrentUser();
      
      // Only allow BUSINESS_ADMIN in business-web
      if (userData.role !== UserRole.BUSINESS_ADMIN) {
        logout();
        return;
      }

      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginRequestDto) => {
    try {
      const response = await apiClient.login(credentials);
      
      // Verify user is BUSINESS_ADMIN
      if (response.user.role !== UserRole.BUSINESS_ADMIN) {
        // Note: This error message is not translated as it's thrown before i18n is available
        throw new Error('Access denied. Business Admin access required.');
      }

      localStorage.setItem('accessToken', response.accessToken);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      setUser(response.user);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isBusinessAdmin: user?.role === UserRole.BUSINESS_ADMIN,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
