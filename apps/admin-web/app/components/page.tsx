'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../components/protected-route';
import { useAuth } from '../../contexts/auth-context';
import { apiClient } from '../../lib/api-client';
import { ComponentDto, CreateComponentDto, UserRole } from '@contracts/core';
import Link from 'next/link';

export default function ComponentsPage() {
  const { logout } = useAuth();
  const [components, setComponents] = useState<ComponentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateComponentDto>({
    name: '',
  });

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getComponents();
      setComponents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load components');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await apiClient.createComponent(formData);
      setShowCreateForm(false);
      setFormData({ name: '' });
      await loadComponents();
    } catch (err: any) {
      setError(err.message || 'Failed to create component');
    }
  };

  return (
    <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <Link href="/dashboard" style={{ marginRight: '1rem', textDecoration: 'none' }}>← Dashboard</Link>
            <h1 style={{ display: 'inline', marginLeft: '1rem' }}>Components</h1>
          </div>
          <div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{
                padding: '0.5rem 1rem',
                marginRight: '1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showCreateForm ? 'Cancel' : '+ New Component'}
            </button>
            <button
              onClick={logout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ccc',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {showCreateForm && (
          <form onSubmit={handleCreate} style={{
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '2rem',
            backgroundColor: 'white'
          }}>
            <h2>Create Component</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="e.g., Soup, Main Dish, Salad"
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create Component
            </button>
          </form>
        )}

        {loading ? (
          <p>Loading components...</p>
        ) : components.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}>
            <p>No components found. Create your first component to get started.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Created</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {components.map((component) => (
                <tr key={component.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>{component.name}</td>
                  <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.875rem' }}>
                    {new Date(component.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <Link
                      href={`/components/${component.id}/variants`}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#0070f3',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}
                    >
                      Manage Variants
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ProtectedRoute>
  );
}
