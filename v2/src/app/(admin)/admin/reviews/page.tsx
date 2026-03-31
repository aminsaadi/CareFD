"use client";

import {  useState, useEffect  } from "react";
import api from "@/lib/api-client";
import { toast } from "sonner";
import {
  FiStar, FiCheck, FiX, FiUser, FiBriefcase, FiMessageSquare,
  FiThumbsUp, FiThumbsDown, FiFilter, FiClock, FiEye, FiTrash2
} from 'react-icons/fi';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedReview, setSelectedReview] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [filterStatus]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const data = await api.get(`/admin/reviews${params}`);
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('שגיאה בטעינת ביקורות');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      await api.put(`/admin/reviews/${reviewId}/approve`, {});
      toast.success('הביקורת אושרה בהצלחה');
      fetchReviews();
    } catch (error) {
      toast.error('שגיאה באישור הביקורת');
    }
  };

  const handleReject = async (reviewId) => {
    try {
      await api.put(`/admin/reviews/${reviewId}/reject`, {
        reason: rejectReason || 'חוות הדעת לא עומדת בקריטריונים'
      });
      toast.success('הביקורת נדחתה');
      setShowRejectModal(null);
      setRejectReason('');
      fetchReviews();
    } catch (error) {
      toast.error('שגיאה בדחיית הביקורת');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את חוות הדעת? פעולה זו בלתי הפיכה.')) return;
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      toast.success('חוות הדעת נמחקה בהצלחה');
      fetchReviews();
    } catch (error) {
      toast.error('שגיאה במחיקת חוות הדעת');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'ממתין לאישור', color: 'bg-yellow-100 text-yellow-700', icon: FiClock },
      approved: { label: 'מאושר', color: 'bg-green-100 text-green-700', icon: FiCheck },
      rejected: { label: 'נדחה', color: 'bg-red-100 text-red-700', icon: FiX }
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${c.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {c.label}
      </span>
    );
  };

  const renderStars = (rating) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <FiStar
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  const statusCounts = {
    pending: reviews.length,
    all: reviews.length
  };

  return (
    
      <div className="space-y-6" data-testid="admin-reviews-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ניהול ביקורות</h1>
            <p className="text-gray-500 mt-1">אישור ודחייה של ביקורות משתמשים</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100" data-testid="review-filter-tabs">
          {[
            { value: 'pending', label: 'ממתינים', icon: FiClock },
            { value: 'approved', label: 'מאושרים', icon: FiCheck },
            { value: 'rejected', label: 'נדחו', icon: FiX },
            { value: '', label: 'הכל', icon: FiFilter },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value)}
                data-testid={`filter-${tab.value || 'all'}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filterStatus === tab.value
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <FiStar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">אין ביקורות {filterStatus === 'pending' ? 'ממתינות' : ''}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div
                key={review.review_id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
                data-testid={`review-card-${review.review_id}`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Review Content */}
                  <div className="flex-1 space-y-3">
                    {/* User & Provider */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 text-sm">
                        <FiUser className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {review.user_info?.name || 'משתמש'}
                        </span>
                        <span className="text-gray-400">({review.user_info?.email})</span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <div className="flex items-center gap-2 text-sm">
                        <FiBriefcase className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-teal-700">
                          {review.provider_info?.business_name || 'ספק'}
                        </span>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-3">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500 font-medium">{review.rating}/5</span>
                      {getStatusBadge(review.status)}
                    </div>

                    {/* Comment */}
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>

                    {/* Detailed Ratings */}
                    {(review.service_quality || review.punctuality || review.communication || review.price_value) && (
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        {review.service_quality && (
                          <span>איכות: {review.service_quality}/5</span>
                        )}
                        {review.punctuality && (
                          <span>דייקנות: {review.punctuality}/5</span>
                        )}
                        {review.communication && (
                          <span>תקשורת: {review.communication}/5</span>
                        )}
                        {review.price_value && (
                          <span>תמורה: {review.price_value}/5</span>
                        )}
                        {review.would_recommend !== undefined && (
                          <span className="flex items-center gap-1">
                            {review.would_recommend ? (
                              <><FiThumbsUp className="w-3.5 h-3.5 text-green-500" /> ממליץ</>
                            ) : (
                              <><FiThumbsDown className="w-3.5 h-3.5 text-red-500" /> לא ממליץ</>
                            )}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Date */}
                    <p className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('he-IL', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>

                    {/* Rejection Reason */}
                    {review.status === 'rejected' && review.rejection_reason && (
                      <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">
                        סיבת דחייה: {review.rejection_reason}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2 shrink-0">
                    {review.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(review.review_id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                          data-testid={`approve-review-${review.review_id}`}
                        >
                          <FiCheck className="w-4 h-4" />
                          אשר
                        </button>
                        <button
                          onClick={() => setShowRejectModal(review.review_id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                          data-testid={`reject-review-${review.review_id}`}
                        >
                          <FiX className="w-4 h-4" />
                          דחה
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(review.review_id)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition text-sm font-medium border border-gray-200"
                      data-testid={`delete-review-${review.review_id}`}
                    >
                      <FiTrash2 className="w-4 h-4" />
                      מחק
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6" data-testid="reject-modal">
              <h3 className="text-lg font-bold text-gray-900 mb-4">דחיית ביקורת</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="סיבת הדחייה (אופציונלי)..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none h-24"
                data-testid="reject-reason-input"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectReason('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition font-medium"
                >
                  ביטול
                </button>
                <button
                  onClick={() => handleReject(showRejectModal)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium"
                  data-testid="confirm-reject-btn"
                >
                  אשר דחייה
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    
  );
};


