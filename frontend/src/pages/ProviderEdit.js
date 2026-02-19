import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import MapPicker from '../components/MapPicker';
import api from '../utils/api';
import { FaPlus, FaTrash, FaEdit, FaSave } from 'react-icons/fa';

const ProviderEdit = () => {
  const { t } = useTranslation();
  const { providerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  // Forms state
  const [basicInfo, setBasicInfo] = useState({
    business_name: '',
    description: '',
    provider_type: 'individual',
    profession_title: '',
    specializations: ['']
  });
  const [location, setLocation] = useState({
    address: '',
    city: '',
    country: 'Israel',
    latitude: null,
    longitude: null,
    coverage_radius_km: 10
  });
  const [services, setServices] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newService, setNewService] = useState(null);
  const [newTeamMember, setNewTeamMember] = useState(null);

  useEffect(() => {
    fetchProvider();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  const fetchProvider = async () => {
    try {
      const response = await api.get(`/providers/${providerId}`);
      const data = response.data;
      
      if (data.user_id !== user.user_id) {
        navigate('/dashboard');
        return;
      }

      setProvider(data);
      setBasicInfo({
        business_name: data.business_name || '',
        description: data.description || '',
        provider_type: data.provider_type || 'individual',
        profession_title: data.profession_title || '',
        specializations: data.specializations && data.specializations.length > 0 ? data.specializations : ['']
      });
      setLocation(data.location || location);
      setServices(data.services_list || []);
      setTeamMembers(data.team_members || []);
    } catch (error) {
      console.error('Failed to fetch provider:', error);
      setError(t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBasicInfo = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/providers/${providerId}`, {
        ...basicInfo,
        specializations: basicInfo.specializations.filter(s => s.trim() !== ''),
        location
      });
      alert('פרופיל נשמר בהצלחה!');
    } catch (err) {
      setError(err.response?.data?.detail || t('errorOccurred'));
    } finally {
      setSaving(false);
    }
  };

  const handleSpecializationChange = (index, value) => {
    const newSpecs = [...basicInfo.specializations];
    newSpecs[index] = value;
    setBasicInfo({ ...basicInfo, specializations: newSpecs });
  };

  const addSpecialization = () => {
    setBasicInfo({
      ...basicInfo,
      specializations: [...basicInfo.specializations, '']
    });
  };

  const removeSpecialization = (index) => {
    setBasicInfo({
      ...basicInfo,
      specializations: basicInfo.specializations.filter((_, i) => i !== index)
    });
  };

  const handleAddService = async () => {
    if (!newService) return;
    try {
      const response = await api.post('/services', newService);
      setServices([...services, response.data]);
      setNewService(null);
      alert('שירות נוסף בהצלחה!');
    } catch (err) {
      alert(err.response?.data?.detail || t('errorOccurred'));
    }
  };

  const handleAddTeamMember = async () => {
    if (!newTeamMember) return;
    try {
      const updatedMembers = [...teamMembers, { ...newTeamMember, member_id: `member_${Date.now()}` }];
      await api.put(`/providers/${providerId}`, {
        team_members: updatedMembers
      });
      setTeamMembers(updatedMembers);
      setNewTeamMember(null);
      alert('איש צוות נוסף בהצלחה!');
    } catch (err) {
      alert(err.response?.data?.detail || t('errorOccurred'));
    }
  };

  const handleRemoveTeamMember = async (memberId) => {
    try {
      const updatedMembers = teamMembers.filter(m => m.member_id !== memberId);
      await api.put(`/providers/${providerId}`, {
        team_members: updatedMembers
      });
      setTeamMembers(updatedMembers);
      alert('איש צוות הוסר בהצלחה!');
    } catch (err) {
      alert(err.response?.data?.detail || t('errorOccurred'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6" data-testid="edit-provider-title">
          {t('editProfile')}
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'basic'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              data-testid="tab-basic"
            >
              מידע בסיסי
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'services'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              data-testid="tab-services"
            >
              {t('services')}
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'team'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              data-testid="tab-team"
            >
              צוות
            </button>
          </div>

          <div className="p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('businessName')}
                  </label>
                  <input
                    type="text"
                    value={basicInfo.business_name}
                    onChange={(e) => setBasicInfo({ ...basicInfo, business_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    data-testid="business-name-input"
                  />
                </div>

                {/* Profession Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    מקצוע
                  </label>
                  <select
                    value={basicInfo.profession_title}
                    onChange={(e) => setBasicInfo({ ...basicInfo, profession_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                    data-testid="profession-title-select"
                  >
                    <option value="">בחר מקצוע</option>
                    <option value="doctor">רופא/ה</option>
                    <option value="nurse">אח/ות מוסמך/ת</option>
                    <option value="physiotherapist">פיזיותרפיסט/ית</option>
                    <option value="occupational_therapist">מרפא/ה בעיסוק</option>
                    <option value="student">סטודנט/ית</option>
                    <option value="caregiver">מטפל/ת</option>
                    <option value="psychologist">פסיכולוג/ית</option>
                    <option value="social_worker">עובד/ת סוציאלי/ת</option>
                    <option value="dietitian">דיאטן/ית</option>
                    <option value="speech_therapist">קלינאי/ת תקשורת</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('description')}
                  </label>
                  <textarea
                    value={basicInfo.description}
                    onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    data-testid="description-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('specializations')}
                  </label>
                  {basicInfo.specializations.map((spec, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={spec}
                        onChange={(e) => handleSpecializationChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        data-testid={`spec-${index}`}
                      />
                      {basicInfo.specializations.length > 1 && (
                        <button
                          onClick={() => removeSpecialization(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addSpecialization}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-2"
                  >
                    <FaPlus /> הוסף התמחות
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('location')}</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="כתובת"
                      value={location.address}
                      onChange={(e) => setLocation({ ...location, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="עיר"
                      value={location.city}
                      onChange={(e) => setLocation({ ...location, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <MapPicker location={location} setLocation={setLocation} />
                  </div>
                </div>

                <button
                  onClick={handleSaveBasicInfo}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
                  data-testid="save-basic-btn"
                >
                  <FaSave /> {saving ? t('loading') : t('save')}
                </button>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">שירותים קיימים</h3>
                  {services.length === 0 ? (
                    <p className="text-gray-600">עדיין לא הוספת שירותים</p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {services.map((service) => (
                        <div key={service.service_id} className="border p-4 rounded-lg">
                          <h4 className="font-semibold">{service.name}</h4>
                          <p className="text-sm text-gray-600">{service.description}</p>
                          <div className="mt-2">
                            <span className="font-bold text-blue-600">₪{service.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!newService ? (
                  <button
                    onClick={() => setNewService({
                      name: '',
                      description: '',
                      service_type: 'clinic_visit',
                      pricing_type: 'consultation',
                      price: 0
                    })}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    data-testid="add-service-btn"
                  >
                    <FaPlus /> הוסף שירות
                  </button>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold">שירות חדש</h3>
                    <input
                      type="text"
                      placeholder="שם השירות"
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <textarea
                      placeholder="תיאור"
                      value={newService.description}
                      onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      rows="3"
                    />
                    <input
                      type="number"
                      placeholder="מחיר"
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddService}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        שמור
                      </button>
                      <button
                        onClick={() => setNewService(null)}
                        className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">אנשי צוות</h3>
                  {teamMembers.length === 0 ? (
                    <p className="text-gray-600">עדיין לא הוספת אנשי צוות</p>
                  ) : (
                    <div className="space-y-3">
                      {teamMembers.map((member) => (
                        <div key={member.member_id} className="flex justify-between items-center border p-4 rounded-lg">
                          <div>
                            <h4 className="font-semibold">{member.name}</h4>
                            <p className="text-sm text-gray-600">{member.role}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveTeamMember(member.member_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!newTeamMember ? (
                  <button
                    onClick={() => setNewTeamMember({ name: '', role: 'staff', specializations: [] })}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    data-testid="add-team-member-btn"
                  >
                    <FaPlus /> הוסף איש צוות
                  </button>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold">איש צוות חדש</h3>
                    <input
                      type="text"
                      placeholder="שם"
                      value={newTeamMember.name}
                      onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <select
                      value={newTeamMember.role}
                      onChange={(e) => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="owner">בעלים</option>
                      <option value="admin">מנהל</option>
                      <option value="staff">צוות</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddTeamMember}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        שמור
                      </button>
                      <button
                        onClick={() => setNewTeamMember(null)}
                        className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderEdit;