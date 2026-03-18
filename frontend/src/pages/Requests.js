import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RequestCard from '../components/RequestCard';
import api from '../utils/api';
import { toast } from 'sonner';

const isPatientRole = (role) => role === 'patient' || role === 'user';

const GENDER_PREFERENCE_OPTIONS = [
  { value: 'no_preference', label: 'ללא העדפה' },
  { value: 'male', label: 'זכר' },
  { value: 'female', label: 'נקבה' },
];

const LANGUAGE_OPTIONS = [
  { value: 'hebrew', label: 'עברית' },
  { value: 'arabic', label: 'ערבית' },
  { value: 'english', label: 'אנגלית' },
  { value: 'russian', label: 'רוסית' },
  { value: 'french', label: 'צרפתית' },
  { value: 'spanish', label: 'ספרדית' },
  { value: 'amharic', label: 'אמהרית' },
];

const BUDGET_TYPE_OPTIONS = [
  { value: 'per_hour', label: 'לשעה' },
  { value: 'per_treatment', label: 'לטיפול' },
  { value: 'per_visit', label: 'לביקור' },
];

const Requests = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get('create') === 'true');
  const [activeTab, setActiveTab] = useState('all');

  // Options fetched from backend
  const [professionOptions, setProfessionOptions] = useState([]);
  const [serviceTypeOptions, setServiceTypeOptions] = useState([]);
  const [deliveryTypeOptions, setDeliveryTypeOptions] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    professions: [],
    service_type: '',
    delivery_type: '',
    budget: '',
    budget_type: '',
    urgency: 'medium',
    preferred_date: '',
    preferred_time: '',
    gender_preference: '',
    language_preferences: [],
    request_type: 'one_time',
    preferences: '',
  });

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    fetchFormOptions();
  }, []);

  const fetchFormOptions = async () => {
    try {
      const [professionsRes, serviceTypesRes, deliveryTypesRes] = await Promise.all([
        api.get('/professions').catch(() => ({ data: { professions: [] } })),
        api.get('/service-types').catch(() => ({ data: { service_types: [] } })),
        api.get('/delivery-types').catch(() => ({ data: { delivery_types: [] } })),
      ]);

      // Flatten professions for selection
      const profs = professionsRes.data?.professions || professionsRes.data || [];
      setProfessionOptions(Array.isArray(profs) ? profs : []);

      const sTypes = serviceTypesRes.data?.service_types || serviceTypesRes.data || [];
      setServiceTypeOptions(Array.isArray(sTypes) ? sTypes : []);

      const dTypes = deliveryTypesRes.data?.delivery_types || deliveryTypesRes.data || [];
      setDeliveryTypeOptions(Array.isArray(dTypes) ? dTypes : []);
    } catch (error) {
      console.error('Failed to fetch form options:', error);
    }
  };

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

  const handleProfessionToggle = (professionId) => {
    setFormData(prev => {
      const current = prev.professions;
      if (current.includes(professionId)) {
        return { ...prev, professions: current.filter(id => id !== professionId) };
      }
      if (current.length >= 3) {
        toast.error('ניתן לבחור עד 3 מקצועות');
        return prev;
      }
      return { ...prev, professions: [...current, professionId] };
    });
  };

  const handleLanguageToggle = (lang) => {
    setFormData(prev => {
      const current = prev.language_preferences;
      if (current.includes(lang)) {
        return { ...prev, language_preferences: current.filter(l => l !== lang) };
      }
      return { ...prev, language_preferences: [...current, lang] };
    });
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        professions: formData.professions.length > 0 ? formData.professions : [],
        service_type: formData.service_type || null,
        delivery_type: formData.delivery_type || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        budget_type: formData.budget_type || null,
        request_type: formData.request_type,
        urgency: formData.urgency,
        preferred_date: formData.preferred_date || null,
        preferred_time: formData.preferred_time || null,
        gender_preference: formData.gender_preference || null,
        language_preferences: formData.language_preferences.length > 0 ? formData.language_preferences : [],
        preferences: formData.preferences || null,
      };
      await api.post('/requests', payload);
      toast.success('הבקשה נוצרה בהצלחה!');
      setShowCreateForm(false);
      setFormData({
        title: '', description: '', professions: [], service_type: '',
        delivery_type: '', budget: '', budget_type: '', urgency: 'medium',
        preferred_date: '', preferred_time: '', gender_preference: '',
        language_preferences: [], request_type: 'one_time', preferences: ''
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
        {isPatientRole(user?.role) && !showCreateForm && (
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
          {isPatientRole(user?.role) && (
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
            {isPatientRole(user?.role) && (
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
                  כותרת *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                  placeholder="תארו בקצרה את השירות שאתם מחפשים"
                  data-testid="request-title-input"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-carelink-navy">
                  פרטים נוספים *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                  rows="4"
                  placeholder="פרטו על הצורך, מצב רפואי רלוונטי, דרישות מיוחדות..."
                  data-testid="request-description-input"
                />
              </div>

              {/* Professions - multi-select chips, up to 3 */}
              <div>
                <label className="block text-sm font-medium text-carelink-navy mb-2">
                  מקצוע (עד 3)
                </label>
                <div className="flex flex-wrap gap-2" data-testid="request-professions-select">
                  {professionOptions.map((prof) => {
                    const profId = prof.profession_id || prof.id || prof.value;
                    const profName = prof.name || prof.name_he || prof.label;
                    const isSelected = formData.professions.includes(profId);
                    return (
                      <button
                        key={profId}
                        type="button"
                        onClick={() => handleProfessionToggle(profId)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition ${
                          isSelected
                            ? 'bg-carelink-teal text-white border-carelink-teal'
                            : 'bg-white text-carelink-navy border-carelink-light-gray hover:border-carelink-teal'
                        }`}
                      >
                        {profName}
                      </button>
                    );
                  })}
                  {professionOptions.length === 0 && (
                    <span className="text-sm text-gray-400">טוען מקצועות...</span>
                  )}
                </div>
                {formData.professions.length > 0 && (
                  <p className="text-xs text-carelink-gray mt-1">
                    נבחרו {formData.professions.length}/3
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Service Type - synced with backend */}
                <div>
                  <label className="block text-sm font-medium text-carelink-navy">
                    סוג שירות
                  </label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                    data-testid="request-service-type-select"
                  >
                    <option value="">-- בחר סוג שירות --</option>
                    {serviceTypeOptions.map((st) => (
                      <option key={st.type_id || st.id || st.value} value={st.value || st.type_id || st.id}>
                        {st.name_he || st.name || st.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delivery Type - synced with backend */}
                <div>
                  <label className="block text-sm font-medium text-carelink-navy">
                    דרך מתן השירות
                  </label>
                  <select
                    value={formData.delivery_type}
                    onChange={(e) => setFormData({ ...formData, delivery_type: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                    data-testid="request-delivery-type-select"
                  >
                    <option value="">-- בחר דרך מתן שירות --</option>
                    {deliveryTypeOptions.map((dt) => (
                      <option key={dt.type_id || dt.id || dt.value} value={dt.value || dt.type_id || dt.id}>
                        {dt.name_he || dt.name || dt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Budget + Budget Type */}
                <div>
                  <label className="block text-sm font-medium text-carelink-navy">
                    תקציב
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                      placeholder="₪"
                      data-testid="request-budget-input"
                    />
                    <select
                      value={formData.budget_type}
                      onChange={(e) => setFormData({ ...formData, budget_type: e.target.value })}
                      className="block w-32 px-2 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal text-sm"
                      data-testid="request-budget-type-select"
                    >
                      <option value="">סוג</option>
                      {BUDGET_TYPE_OPTIONS.map((bt) => (
                        <option key={bt.value} value={bt.value}>{bt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-sm font-medium text-carelink-navy">
                    דחיפות
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                    data-testid="request-urgency-select"
                  >
                    <option value="low">נמוכה</option>
                    <option value="medium">בינונית</option>
                    <option value="high">גבוהה</option>
                    <option value="urgent">דחוף</option>
                  </select>
                </div>

                {/* Preferred Date */}
                <div>
                  <label className="block text-sm font-medium text-carelink-navy">
                    תאריך רצוי
                  </label>
                  <input
                    type="date"
                    value={formData.preferred_date}
                    onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                    data-testid="request-date-input"
                  />
                </div>

                {/* Preferred Time */}
                <div>
                  <label className="block text-sm font-medium text-carelink-navy">
                    שעה רצויה
                  </label>
                  <input
                    type="time"
                    value={formData.preferred_time}
                    onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                    data-testid="request-time-input"
                  />
                </div>

                {/* Gender Preference */}
                <div>
                  <label className="block text-sm font-medium text-carelink-navy">
                    העדפת מגדר
                  </label>
                  <select
                    value={formData.gender_preference}
                    onChange={(e) => setFormData({ ...formData, gender_preference: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:ring-carelink-teal focus:border-carelink-teal"
                    data-testid="request-gender-select"
                  >
                    <option value="">-- ללא העדפה --</option>
                    {GENDER_PREFERENCE_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>

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
              </div>

              {/* Language Preferences - multi-select chips */}
              <div>
                <label className="block text-sm font-medium text-carelink-navy mb-2">
                  העדפות שפה
                </label>
                <div className="flex flex-wrap gap-2" data-testid="request-languages-select">
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const isSelected = formData.language_preferences.includes(lang.value);
                    return (
                      <button
                        key={lang.value}
                        type="button"
                        onClick={() => handleLanguageToggle(lang.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition ${
                          isSelected
                            ? 'bg-carelink-teal text-white border-carelink-teal'
                            : 'bg-white text-carelink-navy border-carelink-light-gray hover:border-carelink-teal'
                        }`}
                      >
                        {lang.label}
                      </button>
                    );
                  })}
                </div>
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
