import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendar, FaMoneyBillWave, FaMapMarkerAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

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
            <span>{format(new Date(request.created_at), 'dd/MM/yyyy')}</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getStatusColor(request.status)}`}>
          {getStatusText(request.status)}
        </span>
      </div>

      <p className="text-carefd-slate mb-4 line-clamp-2">{request.description}</p>

      <div className="space-y-2 mb-4">
        {request.specialization && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-carefd-navy">התמחות:</span>
            <span className="bg-carefd-teal-pale text-carefd-teal text-sm px-3 py-1 rounded-full">
              {request.specialization}
            </span>
          </div>
        )}

        {request.budget && (
          <div className="flex items-center gap-2">
            <FaMoneyBillWave className="text-carefd-teal" />
            <span className="text-sm font-medium text-carefd-navy">תקציב:</span>
            <span className="text-lg font-bold text-carefd-teal">₪{request.budget}</span>
          </div>
        )}

        {request.location && (
          <div className="flex items-center gap-2 text-sm text-carefd-gray">
            <FaMapMarkerAlt className="text-carefd-teal" />
            <span>{request.location.city}</span>
          </div>
        )}
      </div>

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