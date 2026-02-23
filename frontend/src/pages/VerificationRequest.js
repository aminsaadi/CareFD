import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { 
  FaUpload, FaIdCard, FaFileAlt, FaCheckCircle, 
  FaClock, FaTimesCircle, FaSpinner, FaArrowRight,
  FaShieldAlt, FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'sonner';

const VerificationRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [documents, setDocuments] = useState({
    id_card: null,
    id_card_back: null,
    professional_license: null, // Only for providers
    additional_doc: null
  });
  const [previews, setPreviews] = useState({});
  const [notes, setNotes] = useState('');

  const isProvider = user?.role === 'provider';

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await api.get('/verification/status');
      setVerificationStatus(response.data);
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field, file) => {
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('הקובץ גדול מדי. מקסימום 5MB');
        return;
      }
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('סוג קובץ לא נתמך. השתמש ב-JPG, PNG, WEBP או PDF');
        return;
      }

      setDocuments(prev => ({ ...prev, [field]: file }));
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => ({ ...prev, [field]: reader.result }));
        };
        reader.readAsDataURL(file);
      } else {
        setPreviews(prev => ({ ...prev, [field]: 'pdf' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required documents
    if (!documents.id_card) {
      toast.error('יש להעלות תעודת זהות (צד קדמי)');
      return;
    }

    setSubmitting(true);
    
    try {
      const formData = new FormData();
      
      // Add documents
      Object.entries(documents).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });
      
      // Add notes
      formData.append('notes', notes);
      formData.append('user_type', isProvider ? 'provider' : 'user');

      await api.post('/verification/request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('בקשת האימות נשלחה בהצלחה!');
      fetchVerificationStatus();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'שגיאה בשליחת הבקשה');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusDisplay = () => {
    if (!verificationStatus) return null;

    const statusConfig = {
      pending: {
        icon: FaClock,
        color: 'text-yellow-500',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        title: 'בקשה בבדיקה',
        description: 'הבקשה שלך נמצאת בתהליך בדיקה. נעדכן אותך בהקדם.'
      },
      approved: {
        icon: FaCheckCircle,
        color: 'text-green-500',
        bg: 'bg-green-50',
        border: 'border-green-200',
        title: 'חשבון מאומת',
        description: 'החשבון שלך אומת בהצלחה!'
      },
      rejected: {
        icon: FaTimesCircle,
        color: 'text-red-500',
        bg: 'bg-red-50',
        border: 'border-red-200',
        title: 'בקשה נדחתה',
        description: verificationStatus.rejection_reason || 'הבקשה נדחתה. ניתן להגיש בקשה חדשה.'
      }
    };

    const config = statusConfig[verificationStatus.status];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <div className={`${config.bg} ${config.border} border-2 rounded-2xl p-6 mb-8`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full ${config.bg} flex items-center justify-center`}>
            <Icon className={`text-2xl ${config.color}`} />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${config.color}`}>{config.title}</h3>
            <p className="text-gray-600">{config.description}</p>
          </div>
        </div>
        {verificationStatus.status === 'approved' && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => navigate(isProvider ? '/provider/dashboard' : '/user/dashboard')}
              className="flex items-center gap-2 text-carelink-teal hover:underline"
            >
              <span>חזור לדאשבורד</span>
              <FaArrowRight />
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <FaSpinner className="animate-spin text-4xl text-carelink-teal" />
        </div>
        <Footer />
      </div>
    );
  }

  // If already verified
  if (verificationStatus?.status === 'approved') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          {getStatusDisplay()}
        </div>
        <Footer />
      </div>
    );
  }

  // If pending verification
  if (verificationStatus?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          {getStatusDisplay()}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4">מסמכים שהועלו:</h3>
            <ul className="space-y-2 text-gray-600">
              {verificationStatus.documents?.map((doc, index) => (
                <li key={index} className="flex items-center gap-2">
                  <FaFileAlt className="text-carelink-teal" />
                  <span>{doc.name || `מסמך ${index + 1}`}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-carelink-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaShieldAlt className="text-4xl text-carelink-teal" />
          </div>
          <h1 className="text-3xl font-bold text-carelink-navy mb-2">
            בקשת אימות {isProvider ? 'ספק' : 'משתמש'}
          </h1>
          <p className="text-carelink-gray max-w-lg mx-auto">
            כדי לאמת את החשבון שלך, יש להעלות את המסמכים הנדרשים. 
            לאחר הבדיקה תקבל עדכון.
          </p>
        </div>

        {/* Rejected status message */}
        {verificationStatus?.status === 'rejected' && getStatusDisplay()}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
            <FaUpload className="text-carelink-teal" />
            העלאת מסמכים
          </h2>

          {/* Required Documents */}
          <div className="space-y-6">
            {/* ID Card Front */}
            <div>
              <label className="block text-sm font-semibold text-carelink-navy mb-2">
                תעודת זהות - צד קדמי <span className="text-red-500">*</span>
              </label>
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                  ${documents.id_card ? 'border-carelink-teal bg-carelink-teal/5' : 'border-gray-300 hover:border-carelink-teal'}`}
                onClick={() => document.getElementById('id_card').click()}
              >
                <input
                  type="file"
                  id="id_card"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange('id_card', e.target.files[0])}
                />
                {previews.id_card ? (
                  previews.id_card === 'pdf' ? (
                    <div className="flex items-center justify-center gap-2 text-carelink-teal">
                      <FaFileAlt className="text-2xl" />
                      <span>{documents.id_card?.name}</span>
                    </div>
                  ) : (
                    <img src={previews.id_card} alt="תעודת זהות" className="max-h-40 mx-auto rounded-lg" />
                  )
                ) : (
                  <>
                    <FaIdCard className="text-4xl text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">לחץ להעלאת קובץ</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP או PDF (עד 5MB)</p>
                  </>
                )}
              </div>
            </div>

            {/* ID Card Back */}
            <div>
              <label className="block text-sm font-semibold text-carelink-navy mb-2">
                תעודת זהות - צד אחורי (מומלץ)
              </label>
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                  ${documents.id_card_back ? 'border-carelink-teal bg-carelink-teal/5' : 'border-gray-300 hover:border-carelink-teal'}`}
                onClick={() => document.getElementById('id_card_back').click()}
              >
                <input
                  type="file"
                  id="id_card_back"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange('id_card_back', e.target.files[0])}
                />
                {previews.id_card_back ? (
                  previews.id_card_back === 'pdf' ? (
                    <div className="flex items-center justify-center gap-2 text-carelink-teal">
                      <FaFileAlt className="text-2xl" />
                      <span>{documents.id_card_back?.name}</span>
                    </div>
                  ) : (
                    <img src={previews.id_card_back} alt="תעודת זהות אחורי" className="max-h-40 mx-auto rounded-lg" />
                  )
                ) : (
                  <>
                    <FaIdCard className="text-4xl text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">לחץ להעלאת קובץ</p>
                  </>
                )}
              </div>
            </div>

            {/* Professional License - Only for providers */}
            {isProvider && (
              <div>
                <label className="block text-sm font-semibold text-carelink-navy mb-2">
                  רישיון עיסוק / תעודה מקצועית <span className="text-red-500">*</span>
                </label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                    ${documents.professional_license ? 'border-carelink-teal bg-carelink-teal/5' : 'border-gray-300 hover:border-carelink-teal'}`}
                  onClick={() => document.getElementById('professional_license').click()}
                >
                  <input
                    type="file"
                    id="professional_license"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileChange('professional_license', e.target.files[0])}
                  />
                  {previews.professional_license ? (
                    previews.professional_license === 'pdf' ? (
                      <div className="flex items-center justify-center gap-2 text-carelink-teal">
                        <FaFileAlt className="text-2xl" />
                        <span>{documents.professional_license?.name}</span>
                      </div>
                    ) : (
                      <img src={previews.professional_license} alt="רישיון עיסוק" className="max-h-40 mx-auto rounded-lg" />
                    )
                  ) : (
                    <>
                      <FaFileAlt className="text-4xl text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">לחץ להעלאת קובץ</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Additional Document */}
            <div>
              <label className="block text-sm font-semibold text-carelink-navy mb-2">
                מסמך נוסף (אופציונלי)
              </label>
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                  ${documents.additional_doc ? 'border-carelink-teal bg-carelink-teal/5' : 'border-gray-300 hover:border-carelink-teal'}`}
                onClick={() => document.getElementById('additional_doc').click()}
              >
                <input
                  type="file"
                  id="additional_doc"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange('additional_doc', e.target.files[0])}
                />
                {previews.additional_doc ? (
                  previews.additional_doc === 'pdf' ? (
                    <div className="flex items-center justify-center gap-2 text-carelink-teal">
                      <FaFileAlt className="text-2xl" />
                      <span>{documents.additional_doc?.name}</span>
                    </div>
                  ) : (
                    <img src={previews.additional_doc} alt="מסמך נוסף" className="max-h-40 mx-auto rounded-lg" />
                  )
                ) : (
                  <>
                    <FaFileAlt className="text-4xl text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">לחץ להעלאת קובץ</p>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-carelink-navy mb-2">
                הערות (אופציונלי)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-carelink-teal"
                placeholder="הערות נוספות לצוות האימות..."
              />
            </div>
          </div>

          {/* Warning */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
            <FaExclamationTriangle className="text-yellow-500 mt-1 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">שים לב:</p>
              <p>המסמכים שתעלה ישמשו לאימות זהותך בלבד ולא יופצו לצדדים שלישיים.</p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !documents.id_card || (isProvider && !documents.professional_license)}
            className="w-full mt-8 bg-carelink-teal text-white py-4 rounded-xl font-bold text-lg
              hover:bg-carelink-teal-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin" />
                שולח בקשה...
              </>
            ) : (
              <>
                <FaShieldAlt />
                שלח בקשת אימות
              </>
            )}
          </button>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default VerificationRequest;
