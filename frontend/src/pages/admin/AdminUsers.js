import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import {
  FiSearch, FiFilter, FiEdit2, FiTrash2, FiMoreVertical,
  FiUser, FiMail, FiCalendar, FiShield, FiCheck, FiX,
  FiUserPlus, FiDownload
} from 'react-icons/fi';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
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
                placeholder="חפש לפי שם, אימייל..."
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
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">משתמש</th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">תפקיד</th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">תאריך הצטרפות</th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">סטטוס</th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="w-8 h-8 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-carelink-gray">
                      לא נמצאו משתמשים
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.user_id} className="border-b border-gray-50 hover:bg-carelink-teal-pale/10 transition">
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.user_id)}
                          onChange={() => toggleSelectUser(user.user_id)}
                          className="w-4 h-4 rounded border-gray-300 text-carelink-teal focus:ring-carelink-teal"
                        />
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
                      <td className="py-4 px-4">
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
                        {user.is_verified ? (
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
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-carelink-slate hover:text-carelink-navy hover:bg-gray-100 rounded-lg transition">
                            <FiEdit2 size={16} />
                          </button>
                          <button 
                            onClick={() => setShowDeleteModal(user)}
                            className="p-2 text-carelink-slate hover:text-red-500 hover:bg-red-50 rounded-lg transition"
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

export default AdminUsers;
