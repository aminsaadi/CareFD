import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RequestCard from '../components/RequestCard';
import api from '../utils/api';

const Requests = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    specialization: '',
    budget: ''
  });

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/requests');
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/requests', formData);
      setShowCreateForm(false);
      setFormData({ title: '', description: '', specialization: '', budget: '' });
      fetchRequests();
    } catch (error) {
      console.error('Failed to create request:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-carelink-navy font-heading" data-testid="requests-title">
            {t('requests')}
          </h1>
          {user?.role === 'patient' && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-carelink-teal text-white px-6 py-2 rounded-lg hover:bg-carelink-teal-medium transition font-medium"
              data-testid="create-request-btn"
            >
              {t('createRequest')}
            </button>
          )}
        </div>

        {/* Create Request Form */}
        {showCreateForm && (
          <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border-2 border-carelink-teal" data-testid="create-request-form">
            <h2 className="text-xl font-semibold mb-4 text-carelink-navy">{t('createRequest')}</h2>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-carelink-navy">
                  {t('requestTitle')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                  data-testid="request-title-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-carelink-navy">
                  {t('requestDescription')}
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                  rows="4"
                  data-testid="request-description-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-carelink-navy">
                  {t('specialization')}
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                  data-testid="request-specialization-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-carelink-navy">
                  {t('budget')}
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                  data-testid="request-budget-input"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-carelink-teal text-white px-6 py-2 rounded-lg hover:bg-carelink-teal-medium transition"
                  data-testid="submit-request-btn"
                >
                  {t('submit')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
                  data-testid="cancel-request-btn"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-12" data-testid="loading-indicator">
            {t('loading')}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-600" data-testid="no-requests">
            לא נמצאו בקשות
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <RequestCard
                key={request.request_id}
                request={request}
                showActions={user?.role === 'provider'}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Requests;