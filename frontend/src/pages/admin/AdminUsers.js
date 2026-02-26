import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import {
  FiSearch, FiFilter, FiEdit2, FiTrash2, FiMoreVertical,
  FiUser, FiMail, FiCalendar, FiShield, FiCheck, FiX,
  FiUserPlus, FiDownload, FiEye, FiMessageSquare, FiSlash,
  FiPhone, FiFileText, FiCheckCircle, FiXCircle, FiClock, FiKey
} from 'react-icons/fi';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showUserModal, setShowUserModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showSuspendModal, setShowSuspendModal] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, selectedRole, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedRole) params.append('role', selectedRole);
      params.append('skip', (pagination.page - 1) * pagination.limit);
      params.append('limit', pagination.limit);
      
      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(response.data.users || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      setLoadingDetails(true);
      const response = await api.get(`/admin/users/${userId}`);
      setUserDetails(response.data);
      
      // Also fetch verification documents
      const docsResponse = await api.get(`/admin/users/${userId}/verification-documents`);
      setUserDetails(prev => ({ ...prev, verification: docsResponse.data }));
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openUserModal = async (user) => {
    setShowUserModal(user);
    await fetchUserDetails(user.user_id);
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setShowDeleteModal(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleEditUser = async (userData) => {
    try {
      await api.put(`/admin/users/${showEditModal.user_id}`, userData);
      setShowEditModal(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleSuspendUser = async (suspendData) => {
    try {
      await api.put(`/admin/users/${showSuspendModal.user_id}/suspend`, suspendData);
      setShowSuspendModal(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
  };

  const handleSendMessage = async (messageData) => {
    try {
      await api.post(`/admin/users/${showMessageModal.user_id}/message`, messageData);
      setShowMessageModal(null);
      toast.success('ההודעה נשלחה בהצלחה!');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('שגיאה בשליחת ההודעה');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    try {
      await api.put(`/admin/users/${showResetPasswordModal.user_id}/password`, { 
        new_password: newPassword 
      });
      setShowResetPasswordModal(null);
      setNewPassword('');
      toast.success('הסיסמה עודכנה בהצלחה!');
    } catch (error) {
      console.error('Failed to reset password:', error);
      toast.error('שגיאה בעדכון הסיסמה');
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.user_id));
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'provider':
        return 'bg-carelink-teal-pale text-carelink-teal border-carelink-teal-light';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'מנהל';
      case 'provider': return 'ספק';
      default: return 'משתמש';
    }
  };

  const getDocumentTypeLabel = (type) => {
    switch (type) {
      case 'id_card': return 'תעודת זהות';
      case 'license': return 'רישיון';
      case 'certificate': return 'תעודה';
      case 'diploma': return 'תואר';
      default: return type;
    }
  };

  const getDocumentStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 text-emerald-600 text-xs"><FiCheckCircle size={12} /> אושר</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 text-red-500 text-xs"><FiXCircle size={12} /> נדחה</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-amber-500 text-xs"><FiClock size={12} /> ממתין</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carelink-navy">ניהול משתמשים</h1>
            <p className="text-carelink-slate mt-1">{pagination.total} משתמשים במערכת</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-carelink-slate rounded-lg hover:bg-gray-50 transition">
              <FiDownload size={18} />
              ייצוא
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-carelink-teal text-white rounded-lg hover:bg-carelink-teal/90 transition shadow-md">
              <FiUserPlus size={18} />
              הוסף משתמש
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-carelink-gray" size={18} />
              <input
                type="text"
                placeholder="חפש לפי שם, אימייל, מספר משתמש..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pr-10 pl-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none min-w-[150px]"
            >
              <option value="">כל התפקידים</option>
              <option value="patient">משתמשים</option>
              <option value="provider">ספקים</option>
              <option value="admin">מנהלים</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-right py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-carelink-teal focus:ring-carelink-teal"
                    />
                  </th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">מזהה</th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">משתמש</th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">תפקיד</th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">תאריך הצטרפות</th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">סטטוס</th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">אימות</th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="w-8 h-8 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-carelink-gray">
                      לא נמצאו משתמשים
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr 
                      key={user.user_id} 
                      className={`border-b border-gray-50 hover:bg-carelink-teal-pale/10 transition cursor-pointer ${user.is_suspended ? 'bg-red-50/50' : ''}`}
                      onClick={() => openUserModal(user)}
                    >
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.user_id)}
                          onChange={() => toggleSelectUser(user.user_id)}
                          className="w-4 h-4 rounded border-gray-300 text-carelink-teal focus:ring-carelink-teal"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-mono text-carelink-teal">{user.user_number || 'N/A'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-carelink-teal to-carelink-navy rounded-full flex items-center justify-center text-white font-medium">
                            {user.name?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="text-carelink-navy font-medium">{user.name || 'ללא שם'}</p>
                            <p className="text-carelink-gray text-sm">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.user_id, e.target.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm border ${getRoleBadge(user.role)} bg-transparent focus:outline-none cursor-pointer`}
                        >
                          <option value="patient">משתמש</option>
                          <option value="provider">ספק</option>
                          <option value="admin">מנהל</option>
                        </select>
                      </td>
                      <td className="py-4 px-4 text-carelink-slate text-sm">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('he-IL') : '-'}
                      </td>
                      <td className="py-4 px-4">
                        {user.is_suspended ? (
                          <span className="inline-flex items-center gap-1 text-red-500 text-sm">
                            <FiSlash size={14} />
                            מושעה
                          </span>
                        ) : user.is_verified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
                            <FiCheck size={14} />
                            מאומת
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-carelink-gray text-sm">
                            <FiX size={14} />
                            לא מאומת
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => openUserModal(user)}
                            className="p-2 text-carelink-slate hover:text-carelink-teal hover:bg-carelink-teal-pale rounded-lg transition"
                            title="צפה בפרטים"
                          >
                            <FiEye size={16} />
                          </button>
                          <button 
                            onClick={() => setShowEditModal(user)}
                            className="p-2 text-carelink-slate hover:text-carelink-navy hover:bg-gray-100 rounded-lg transition"
                            title="ערוך"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button 
                            onClick={() => setShowMessageModal(user)}
                            className="p-2 text-carelink-slate hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                            title="שלח הודעה"
                          >
                            <FiMessageSquare size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              setShowResetPasswordModal(user);
                              setNewPassword('');
                            }}
                            className="p-2 text-carelink-slate hover:text-purple-500 hover:bg-purple-50 rounded-lg transition"
                            title="איפוס סיסמה"
                          >
                            <FiKey size={16} />
                          </button>
                          <button 
                            onClick={() => setShowSuspendModal(user)}
                            className={`p-2 rounded-lg transition ${user.is_suspended ? 'text-emerald-500 hover:bg-emerald-50' : 'text-amber-500 hover:bg-amber-50'}`}
                            title={user.is_suspended ? 'בטל השעיה' : 'השעה'}
                          >
                            <FiSlash size={16} />
                          </button>
                          <button 
                            onClick={() => setShowDeleteModal(user)}
                            className="p-2 text-carelink-slate hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="מחק"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <p className="text-carelink-slate text-sm">
                מציג {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} מתוך {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-white border border-gray-200 text-carelink-navy rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  הקודם
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page * pagination.limit >= pagination.total}
                  className="px-4 py-2 bg-white border border-gray-200 text-carelink-navy rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  הבא
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-3xl my-8 border border-gray-200 shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-carelink-navy">פרטי משתמש</h3>
                <button onClick={() => { setShowUserModal(null); setUserDetails(null); }} className="text-carelink-gray hover:text-carelink-navy">
                  <FiX size={24} />
                </button>
              </div>
            </div>
            
            {loadingDetails ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : userDetails ? (
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* User Info */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-carelink-teal to-carelink-navy rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {userDetails.user?.name?.[0] || 'U'}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-carelink-navy">{userDetails.user?.name}</h4>
                    <p className="text-carelink-teal font-mono text-sm">{userDetails.user?.user_number}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-carelink-slate">
                      <span className="flex items-center gap-1"><FiMail size={14} /> {userDetails.user?.email}</span>
                      {userDetails.user?.phone && <span className="flex items-center gap-1"><FiPhone size={14} /> {userDetails.user?.phone}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${getRoleBadge(userDetails.user?.role)}`}>
                        {getRoleLabel(userDetails.user?.role)}
                      </span>
                      {userDetails.user?.is_suspended && (
                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-600">מושעה</span>
                      )}
                      {userDetails.user?.is_verified && (
                        <span className="px-2 py-1 rounded text-xs bg-emerald-100 text-emerald-600">מאומת</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-carelink-navy">{userDetails.stats?.bookings_count || 0}</p>
                    <p className="text-sm text-carelink-slate">הזמנות</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-carelink-navy">{userDetails.stats?.messages_count || 0}</p>
                    <p className="text-sm text-carelink-slate">הודעות</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-carelink-navy">
                      {userDetails.user?.created_at ? new Date(userDetails.user.created_at).toLocaleDateString('he-IL') : '-'}
                    </p>
                    <p className="text-sm text-carelink-slate">תאריך הצטרפות</p>
                  </div>
                </div>

                {/* Provider Info */}
                {userDetails.provider && (
                  <div className="bg-carelink-teal-pale/20 rounded-lg p-4">
                    <h5 className="font-semibold text-carelink-navy mb-3 flex items-center gap-2">
                      <FiShield size={16} /> פרטי ספק
                    </h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-carelink-slate">מספר ספק:</span>
                        <span className="font-mono text-carelink-teal mr-2">{userDetails.provider.provider_number}</span>
                      </div>
                      <div>
                        <span className="text-carelink-slate">שם עסק:</span>
                        <span className="text-carelink-navy mr-2">{userDetails.provider.business_name || '-'}</span>
                      </div>
                      <div>
                        <span className="text-carelink-slate">סוג:</span>
                        <span className="text-carelink-navy mr-2">{userDetails.provider.provider_type}</span>
                      </div>
                      <div>
                        <span className="text-carelink-slate">סטטוס אימות:</span>
                        <span className={`mr-2 ${userDetails.provider.is_verified ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {userDetails.provider.is_verified ? 'מאומת' : 'לא מאומת'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verification Documents */}
                {userDetails.verification?.documents?.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-carelink-navy mb-3 flex items-center gap-2">
                      <FiFileText size={16} /> מסמכי אימות
                    </h5>
                    <div className="space-y-2">
                      {userDetails.verification.documents.map((doc) => (
                        <div key={doc.document_id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <FiFileText className="text-carelink-teal" size={20} />
                            <div>
                              <p className="text-sm font-medium text-carelink-navy">{getDocumentTypeLabel(doc.document_type)}</p>
                              <p className="text-xs text-carelink-gray">{doc.file_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getDocumentStatusBadge(doc.status)}
                            <a 
                              href={doc.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-carelink-teal hover:underline text-sm"
                            >
                              צפה
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => { setShowUserModal(null); setShowEditModal(showUserModal); }}
                    className="flex-1 px-4 py-2.5 bg-carelink-teal text-white rounded-lg hover:bg-carelink-teal/90 transition flex items-center justify-center gap-2"
                  >
                    <FiEdit2 size={16} /> ערוך פרטים
                  </button>
                  <button
                    onClick={() => { setShowUserModal(null); setShowMessageModal(showUserModal); }}
                    className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
                  >
                    <FiMessageSquare size={16} /> שלח הודעה
                  </button>
                  <button
                    onClick={() => { setShowUserModal(null); setShowSuspendModal(showUserModal); }}
                    className={`flex-1 px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-2 ${showUserModal.is_suspended ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
                  >
                    <FiSlash size={16} /> {showUserModal.is_suspended ? 'בטל השעיה' : 'השעה'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <EditUserModal
          user={showEditModal}
          onClose={() => setShowEditModal(null)}
          onSave={handleEditUser}
        />
      )}

      {/* Suspend User Modal */}
      {showSuspendModal && (
        <SuspendUserModal
          user={showSuspendModal}
          onClose={() => setShowSuspendModal(null)}
          onSuspend={handleSuspendUser}
        />
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <SendMessageModal
          user={showMessageModal}
          onClose={() => setShowMessageModal(null)}
          onSend={handleSendMessage}
        />
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 border border-gray-200 shadow-xl">
            <h3 className="text-lg font-bold text-carelink-navy mb-2">איפוס סיסמה</h3>
            <p className="text-carelink-slate mb-4">
              הגדר סיסמה חדשה עבור המשתמש: <strong>{showResetPasswordModal.name}</strong>
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-carelink-navy mb-2">סיסמה חדשה</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="הזן סיסמה חדשה (מינימום 6 תווים)"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetPasswordModal(null);
                  setNewPassword('');
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-carelink-navy rounded-lg hover:bg-gray-200 transition"
              >
                ביטול
              </button>
              <button
                onClick={handleResetPassword}
                className="flex-1 px-4 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
              >
                עדכן סיסמה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 border border-gray-200 shadow-xl">
            <h3 className="text-lg font-bold text-carelink-navy mb-2">מחיקת משתמש</h3>
            <p className="text-carelink-slate mb-6">
              האם אתה בטוח שברצונך למחוק את המשתמש "{showDeleteModal.name}"? 
              פעולה זו לא ניתנת לביטול.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-carelink-navy rounded-lg hover:bg-gray-200 transition"
              >
                ביטול
              </button>
              <button
                onClick={() => deleteUser(showDeleteModal.user_id)}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

// Edit User Modal Component
const EditUserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    is_verified: user.is_verified || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 border border-gray-200 shadow-xl">
        <h3 className="text-lg font-bold text-carelink-navy mb-4">עריכת משתמש</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-carelink-navy mb-1">שם</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-carelink-navy mb-1">אימייל</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-carelink-navy mb-1">טלפון</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_verified"
              checked={formData.is_verified}
              onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-carelink-teal focus:ring-carelink-teal"
            />
            <label htmlFor="is_verified" className="text-sm text-carelink-navy">משתמש מאומת</label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-carelink-navy rounded-lg hover:bg-gray-200 transition"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-carelink-teal text-white rounded-lg hover:bg-carelink-teal/90 transition"
            >
              שמור
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Suspend User Modal Component
const SuspendUserModal = ({ user, onClose, onSuspend }) => {
  const [reason, setReason] = useState('');
  const isSuspended = user.is_suspended;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuspend({
      is_suspended: !isSuspended,
      reason: reason
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 border border-gray-200 shadow-xl">
        <h3 className="text-lg font-bold text-carelink-navy mb-2">
          {isSuspended ? 'ביטול השעיה' : 'השעיית משתמש'}
        </h3>
        <p className="text-carelink-slate mb-4">
          {isSuspended 
            ? `האם אתה בטוח שברצונך לבטל את ההשעיה של "${user.name}"?`
            : `האם אתה בטוח שברצונך להשעות את "${user.name}"?`
          }
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isSuspended && (
            <div>
              <label className="block text-sm font-medium text-carelink-navy mb-1">סיבת ההשעיה</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="הזן סיבה להשעיה..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none resize-none"
              />
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-carelink-navy rounded-lg hover:bg-gray-200 transition"
            >
              ביטול
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2.5 text-white rounded-lg transition ${isSuspended ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'}`}
            >
              {isSuspended ? 'בטל השעיה' : 'השעה'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Send Message Modal Component
const SendMessageModal = ({ user, onClose, onSend }) => {
  const [formData, setFormData] = useState({
    subject: '',
    content: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.content) return;
    onSend(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 border border-gray-200 shadow-xl">
        <h3 className="text-lg font-bold text-carelink-navy mb-4">שליחת הודעה ל-{user.name}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-carelink-navy mb-1">נושא</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="הודעה ממנהל המערכת"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-carelink-navy mb-1">תוכן ההודעה *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="כתוב את ההודעה..."
              rows={5}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-carelink-navy rounded-lg hover:bg-gray-200 transition"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              שלח הודעה
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUsers;
