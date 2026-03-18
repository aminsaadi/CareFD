import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RequestCard from '../components/RequestCard';
import api from '../utils/api';
import { toast } from 'sonner';

const Requests = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get('create') === 'true');
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    specialization: '',
    budget: '',
    request_type: 'one_time',
    urgency: 'medium',
    preferred_date: '',
    preferences: '',
    service_type: '',
    provider_type: ''
  });

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'my' ? '/requests/my' : '/requests';
      const response = await api.get(endpoint);
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
      const payload = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        preferred_date: formData.preferred_date || null,
        provider_type: formData.provider_type || null,
        service_type: formData.service_type || null,
        specialization: formData.specialization || null,
        preferences: formData.preferences || null
      };
      await api.post('/requests', payload);
      toast.success('הבקשה נוצרה בהצלחה!');
      setShowCreateForm(false);
      setFormData({
        title: '', description: '', specialization: '', budget: '',
        request_type: 'one_time', urgency: 'medium', preferred_date: '',
        preferences: '', service_type: '', provider_type: ''
      });
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('errorOccurred'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* CTA Banner for patients */}
        {user?.role === 'patient' && !showCreateForm && (
          <div className="bg-gradient-to-l from-carelink-teal to-carelink-navy p-6 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-white">
              <h2 className="text-xl font-bold mb-1">צריכים שירות? פרסמו בקשה!</h2>
              <p className="text-carelink-teal-pale text-sm">תארו את הצורך שלכם וקבלו הצעות מספקים מתאימים</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-white text-carelink-teal px-6 py-3 rounded-xl font-bold hover:bg-carelink-teal-pale transition whitespace-nowrap"
              data-testid="create-request-btn"
            >
              + {t('createRequest')}
            </button>
          </div>
        )}

        {/* Login prompt for non-authenticated users */}
        {!user && (
          <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-2xl mb-6 text-center">
            <p className="text-carelink-navy font-medium mb-3">רוצים לפרסם בקשה? התחברו כדי להתחיל</p>
            <Link
              to="/login"
              className="inline-block bg-carelink-teal text-white px-6 py-2 rounded-lg hover:bg-carelink-teal-medium transition font-medium"
            >
              התחברות
            </Link>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-carelink-navy font-heading" data-testid="requests-title">
            {t('requests')}
          </h1>
          {user?.role === 'patient' && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-carelink-teal text-white px-6 py-2 rounded-lg hover:bg-carelink-teal-medium transition font-medium"
              data-testid="create-request-btn-toggle"
            >
              {showCreateForm ? 'סגור' : t('createRequest')}
            </button>
          )}
        </div>

        {/* Tabs */}
        {user && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'all'
                  ? 'bg-carelink-teal text-white'
                  : 'bg-white text-carelink-navy border-2 border-carelink-light-gray hover:border-carelink-teal'
              }`}
              data-testid="tab-all-requests"
            >
              {t('allRequests')}
            </button>
            {user?.role === 'patient' && (
              <button
                onClick={() => setActiveTab('my')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'my'
                    ? 'bg-carelink-teal text-white'
                    : 'bg-white text-carelink-navy border-2 border-carelink-light-gray hover:border-carelink-teal'
                }`}
                data-testid="tab-my-requests"
              >
                {t('myRequests')}
              </button>
            )}
          </div>
        )}

        {/* Create Request Form */}
        {showCreateForm && (
          <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border-2 border-carelink-teal" data-testid="create-request-form">
            <h2 className="text-xl font-semibold mb-4 text-carelink-navy">{t('createRequest')}</h2>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-carelink-navy">
                  {t('requestTitle')} *
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

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-carelink-navy">
                  {t('requestDescription')} *
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

              <div className="grid md:grid-cols-2 gap-4">
                {/* Request Type */}
                <div>
                  <label className="block text-sm font-medium text-carelink-navy">
                    {t('requestType')}
                  </label>
                  <select
                    value={formData.request_type}
                    onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                    data-testid="request-type-select"
                  >
                    <option value="one_time">{t('one_time')}</option>
                    <option value="immediate">{t('immediate')}</option>
                    <option value="scheduled">{t('scheduled')}</option>
                    <option value="follow_up">{t('follow_up')}</option>
                  </select>
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-sm font-medium text-carelink-navy">
                    {t('urgency')}
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                    data-testid="request-urgency-select"
                  >
                    <option value="low">{t('low')}</option>
                    <option value="medium">{t('medium')}</option>
                    <option value="high">{t('high')}</option>
                    <option value="urgent">{t('urgent')}</option>
                  </select>
                </div>

                {/* Specialization */}
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

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-carelink-navy">
                    {t('budget')}
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                    placeholder="₪"
                    data-testid="request-budget-input"
                  />
                </div>

                {/* Preferred Date */}
                <div>
                  <label className="block text-sm font-medium text-carelink-navy">
                    {t('preferredDate')}
                  </label>
                  <input
                    type="date"
                    value={formData.preferred_date}
                    onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                    data-testid="request-date-input"
                  />
                </div>

                {/* Service Type */}
                <div>
                  <label className="block text-sm font-medium text-carelink-navy">
                    {t('serviceType')}
                  </label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                    data-testid="request-service-type-select"
                  >
                    <option value="">-- {t('serviceType')} --</option>
                    <option value="home_visit">{t('homeVisit')}</option>
                    <option value="clinic_visit">{t('clinicVisit')}</option>
                    <option value="video_call">{t('videoCall')}</option>
                    <option value="consultation">{t('consultation')}</option>
                  </select>
                </div>
              </div>

              {/* Preferences */}
              <div>
                <label className="block text-sm font-medium text-carelink-navy">
                  {t('preferences')}
                </label>
                <textarea
                  value={formData.preferences}
                  onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                  rows="2"
                  placeholder="העדפות נוספות..."
                  data-testid="request-preferences-input"
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
            {activeTab === 'my' ? 'אין לך בקשות עדיין' : 'לא נמצאו בקשות'}
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
