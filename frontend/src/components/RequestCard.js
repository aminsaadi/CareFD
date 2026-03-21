import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendar, FaMoneyBillWave, FaMapMarkerAlt, FaComments, FaExclamationTriangle, FaClock, FaUser, FaGlobe } from 'react-icons/fa';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const BUDGET_TYPE_LABELS = {
  per_hour: 'לשעה',
  per_treatment: 'לטיפול',
  per_visit: 'לביקור',
};

const GENDER_LABELS = {
  male: 'זכר',
  female: 'נקבה',
  no_preference: 'ללא העדפה',
};

const LANGUAGE_LABELS = {
  hebrew: 'עברית',
  arabic: 'ערבית',
  english: 'אנגלית',
  russian: 'רוסית',
  french: 'צרפתית',
  spanish: 'ספרדית',
  amharic: 'אמהרית',
};

const RequestCard = ({ request, showActions = false, onMakeOffer }) => {
  const { t } = useTranslation();

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-green-100 text-green-800 border-green-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-gray-100 text-gray-800 border-gray-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      open: 'פתוח',
      in_progress: 'בתהליך',
      completed: 'הושלם',
      cancelled: 'בוטל'
    };
    return texts[status] || status;
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    };
    return colors[urgency] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div
      className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-carefd-teal-pale"
      data-testid={`request-card-${request.request_id}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-carefd-navy mb-1">{request.title}</h3>
          <div className="flex items-center gap-2 text-sm text-carefd-gray">
            <FaCalendar className="text-carefd-teal" />
            <span>{request.created_at ? format(new Date(request.created_at), 'dd/MM/yyyy') : ''}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getStatusColor(request.status)}`}>
            {getStatusText(request.status)}
          </span>
          {request.urgency && request.urgency !== 'medium' && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getUrgencyColor(request.urgency)}`}>
              <FaExclamationTriangle className="text-xs" />
              {t(request.urgency)}
            </span>
          )}
        </div>
      </div>

      <p className="text-carefd-slate mb-4 line-clamp-2">{request.description}</p>

      <div className="space-y-2 mb-4">
        {/* Professions */}
        {request.professions && request.professions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-sm font-medium text-carefd-navy">מקצוע:</span>
            {request.professions.map((prof, idx) => (
              <span key={idx} className="bg-carefd-teal-pale text-carefd-teal text-xs px-2 py-0.5 rounded-full">
                {prof}
              </span>
            ))}
          </div>
        )}

        {/* Legacy specialization fallback */}
        {(!request.professions || request.professions.length === 0) && request.specialization && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-carefd-navy">{t('specialization')}:</span>
            <span className="bg-carefd-teal-pale text-carefd-teal text-sm px-3 py-1 rounded-full">
              {request.specialization}
            </span>
          </div>
        )}

        {request.budget && (
          <div className="flex items-center gap-2">
            <FaMoneyBillWave className="text-carefd-teal" />
            <span className="text-sm font-medium text-carefd-navy">{t('budget')}:</span>
            <span className="text-lg font-bold text-carefd-teal">
              ₪{request.budget}
              {request.budget_type && (
                <span className="text-sm font-normal text-carefd-gray mr-1">
                  {BUDGET_TYPE_LABELS[request.budget_type] || request.budget_type}
                </span>
              )}
            </span>
          </div>
        )}

        {request.location && (
          <div className="flex items-center gap-2 text-sm text-carefd-gray">
            <FaMapMarkerAlt className="text-carefd-teal" />
            <span>{request.location.city}</span>
          </div>
        )}

        {request.preferred_date && (
          <div className="flex items-center gap-2 text-sm text-carefd-gray">
            <FaCalendar className="text-carefd-teal" />
            <span>
              {t('preferredDate')}: {request.preferred_date ? format(new Date(request.preferred_date), 'dd/MM/yyyy') : ''}
              {request.preferred_time && ` בשעה ${request.preferred_time}`}
            </span>
          </div>
        )}

        {request.gender_preference && request.gender_preference !== 'no_preference' && (
          <div className="flex items-center gap-2 text-sm text-carefd-gray">
            <FaUser className="text-carefd-teal" />
            <span>העדפת מגדר: {GENDER_LABELS[request.gender_preference] || request.gender_preference}</span>
          </div>
        )}

        {request.language_preferences && request.language_preferences.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-carefd-gray">
            <FaGlobe className="text-carefd-teal" />
            <span>שפות: {request.language_preferences.map(l => LANGUAGE_LABELS[l] || l).join(', ')}</span>
          </div>
        )}

        {request.request_type && request.request_type !== 'one_time' && (
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full">
              {t(request.request_type)}
            </span>
          </div>
        )}
      </div>

      {/* Offer count badge */}
      {(request.offer_count > 0) && (
        <div className="flex items-center gap-1 mb-3 text-sm text-carefd-gray">
          <FaComments className="text-carefd-teal" />
          <span>{request.offer_count} {t('offerCount')}</span>
        </div>
      )}

      <Link
        to={`/requests/${request.request_id}`}
        className="block w-full text-center bg-carefd-navy text-white px-4 py-2 rounded-lg hover:bg-carefd-slate transition-colors font-medium"
        data-testid={`view-request-${request.request_id}`}
      >
        {showActions ? t('makeOffer') : t('viewOffers')}
      </Link>
    </div>
  );
};

export default RequestCard;
