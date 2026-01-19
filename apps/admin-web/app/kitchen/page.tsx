'use client';

import { useState } from 'react';
import { ProtectedRoute } from '../../components/protected-route';
import { useAuth } from '../../contexts/auth-context';
import { apiClient } from '../../lib/api-client';
import {
  KitchenSummaryDto,
  KitchenBusinessSummaryDto,
  DayLockDto,
  UserRole,
} from '@contracts/core';
import Link from 'next/link';

export default function KitchenPage() {
  const { logout } = useAuth();
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [summary, setSummary] = useState<KitchenSummaryDto | null>(null);
  const [businessSummary, setBusinessSummary] =
    useState<KitchenBusinessSummaryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'business'>('summary');

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getKitchenSummary(date);
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load kitchen summary');
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getKitchenBusinessSummary(date);
      setBusinessSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load business summary');
    } finally {
      setLoading(false);
    }
  };

  const handleLockDay = async () => {
    if (!confirm(`Lock all orders for ${date}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      await apiClient.lockDay(date);
      alert(`Day ${date} locked successfully`);
      // Reload summaries after locking
      if (activeTab === 'summary') {
        await loadSummary();
      } else {
        await loadBusinessSummary();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to lock day');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setSummary(null);
    setBusinessSummary(null);
  };

  const handleTabChange = (tab: 'summary' | 'business') => {
    setActiveTab(tab);
    if (tab === 'summary' && !summary) {
      loadSummary();
    } else if (tab === 'business' && !businessSummary) {
      loadBusinessSummary();
    }
  };

  return (
    <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
      <div style={{ padding: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <div>
            <Link
              href="/dashboard"
              style={{ marginRight: '1rem', textDecoration: 'none' }}
            >
              ← Dashboard
            </Link>
            <h1 style={{ display: 'inline', marginLeft: '1rem' }}>
              Kitchen Operations
            </h1>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ccc',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>

        <div
          style={{
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '2rem',
            backgroundColor: 'white',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="date"
              style={{ display: 'block', marginBottom: '0.5rem' }}
            >
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginRight: '1rem',
              }}
            />
            <button
              onClick={activeTab === 'summary' ? loadSummary : loadBusinessSummary}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: loading ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginRight: '1rem',
              }}
            >
              {loading ? 'Loading...' : 'Load Summary'}
            </button>
            <button
              onClick={handleLockDay}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: loading ? '#ccc' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Lock Day
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button
              onClick={() => handleTabChange('summary')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor:
                  activeTab === 'summary' ? '#0070f3' : '#f5f5f5',
                color: activeTab === 'summary' ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Summary
            </button>
            <button
              onClick={() => handleTabChange('business')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor:
                  activeTab === 'business' ? '#0070f3' : '#f5f5f5',
                color: activeTab === 'business' ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Business Breakdown
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '4px',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        {activeTab === 'summary' && summary && (
          <div
            style={{
              padding: '1.5rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: 'white',
            }}
          >
            <h2>Kitchen Summary - {date}</h2>
            {summary.lockedAt && (
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                Locked at: {new Date(summary.lockedAt).toLocaleString()}
              </p>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <p>
                <strong>Total Meals:</strong> {summary.totalMeals}
              </p>
              <p>
                <strong>Total Amount:</strong> {summary.totalAmount.toFixed(2)} TND
              </p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginTop: '1rem',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th
                      style={{
                        padding: '1rem',
                        textAlign: 'left',
                        borderBottom: '1px solid #ddd',
                      }}
                    >
                      Meal
                    </th>
                    <th
                      style={{
                        padding: '1rem',
                        textAlign: 'right',
                        borderBottom: '1px solid #ddd',
                      }}
                    >
                      Quantity
                    </th>
                    <th
                      style={{
                        padding: '1rem',
                        textAlign: 'right',
                        borderBottom: '1px solid #ddd',
                      }}
                    >
                      Unit Price
                    </th>
                    <th
                      style={{
                        padding: '1rem',
                        textAlign: 'right',
                        borderBottom: '1px solid #ddd',
                      }}
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.meals.map((meal) => (
                    <tr key={meal.mealId} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '1rem' }}>{meal.mealName}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {meal.totalQuantity}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {meal.unitPrice.toFixed(2)} TND
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {meal.totalAmount.toFixed(2)} TND
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'business' && businessSummary && (
          <div
            style={{
              padding: '1.5rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: 'white',
            }}
          >
            <h2>Business Breakdown - {date}</h2>
            {businessSummary.lockedAt && (
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                Locked at: {new Date(businessSummary.lockedAt).toLocaleString()}
              </p>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <p>
                <strong>Total Meals:</strong> {businessSummary.totalMeals}
              </p>
              <p>
                <strong>Total Amount:</strong>{' '}
                {businessSummary.totalAmount.toFixed(2)} TND
              </p>
            </div>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {businessSummary.meals.map((meal) => (
                <div
                  key={meal.mealId}
                  style={{
                    padding: '1rem',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                  }}
                >
                  <h3>{meal.mealName}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                    Total: {meal.totalQuantity} × {meal.unitPrice.toFixed(2)} TND ={' '}
                    {meal.totalAmount.toFixed(2)} TND
                  </p>
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>By Business:</strong>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                      {meal.businesses.map((business) => (
                        <li key={business.businessId}>
                          {business.businessName}: {business.quantity} ×{' '}
                          {meal.unitPrice.toFixed(2)} TND ={' '}
                          {business.totalAmount.toFixed(2)} TND
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!summary && !businessSummary && !loading && (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: 'white',
            }}
          >
            <p>Select a date and click "Load Summary" to view kitchen operations.</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
