"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/api-client';
import { toast } from 'sonner';
import {
  FaUsers, FaPlus, FaEdit, FaTrash, FaUserMd, FaPhone,
  FaEnvelope, FaSave, FaLock, FaUserPlus
} from 'react-icons/fa';

const ProviderTeam = ({ provider }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [form, setForm] = useState({
    name: '', role: '', phone: '', email: '', specialization: ''
  });

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await api.get('/team');
      setMembers(data.members || []);
      setHasAccess(true);
    } catch (error) {
      if (error.response?.status === 403) {
        setHasAccess(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', role: '', phone: '', email: '', specialization: '' });
    setEditingMember(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await api.put(`/team/${editingMember}`, form);
        toast.success('חבר הצוות עודכן');
      } else {
        await api.post('/team', form);
        toast.success('חבר צוות נוסף');
      }
      resetForm();
      fetchTeam();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'שגיאה');
    }
  };

  const handleEdit = (member) => {
    setForm({
      name: member.name, role: member.role || '',
      phone: member.phone || '', email: member.email || '',
      specialization: member.specialization || ''
    });
    setEditingMember(member.member_id);
    setShowForm(true);
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm('האם להסיר את חבר הצוות?')) return;
    try {
      await api.delete(`/team/${memberId}`);
      toast.success('חבר הצוות הוסר');
      fetchTeam();
    } catch (error) {
      toast.error('שגיאה במחיקה');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!hasAccess) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl shadow-lg" data-testid="team-locked">
        <FaLock className="text-4xl text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-700 mb-2">ניהול צוות זמין במנוי זהב בלבד</h3>
        <p className="text-gray-500 text-sm">שדרג למנוי זהב כדי להוסיף ולנהל חברי צוות</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="provider-team">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-carefd-navy flex items-center gap-2">
          <FaUsers className="text-carefd-teal" />
          ניהול צוות
        </h3>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-carefd-teal text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-carefd-teal-medium transition flex items-center gap-2"
          data-testid="add-member-btn"
        >
          <FaUserPlus /> הוסף חבר צוות
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border-2 border-carefd-teal-pale shadow-sm space-y-4">
          <h4 className="font-semibold text-gray-900">{editingMember ? 'עריכת חבר צוות' : 'הוספת חבר צוות'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" data-testid="member-name-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד *</label>
              <input value={form.role} onChange={e => setForm({...form, role: e.target.value})} required placeholder="למשל: רופא, אחות, מזכירה" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" data-testid="member-role-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} dir="ltr" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" dir="ltr" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">התמחות</label>
              <input value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} placeholder="למשל: רפואת משפחה, כירורגיה" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-carefd-teal text-white px-6 py-2.5 rounded-xl font-medium hover:bg-carefd-teal-medium transition flex items-center gap-2" data-testid="save-member-btn">
              <FaSave /> {editingMember ? 'עדכן' : 'הוסף'}
            </button>
            <button type="button" onClick={resetForm} className="border border-gray-300 text-gray-600 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition">
              ביטול
            </button>
          </div>
        </form>
      )}

      {/* Members List */}
      {members.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <FaUsers className="text-4xl text-carefd-teal-pale mx-auto mb-3" />
          <p className="text-gray-500">אין חברי צוות עדיין</p>
          <p className="text-sm text-gray-400 mt-1">הוסף את חברי הצוות שלך</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {members.map(member => (
            <div key={member.member_id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition" data-testid={`member-${member.member_id}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {(member.name || '?')[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{member.name}</h4>
                    <p className="text-sm text-carefd-teal font-medium">{member.role}</p>
                    {member.specialization && (
                      <p className="text-xs text-gray-500 mt-0.5">{member.specialization}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                      {member.phone && (
                        <span className="flex items-center gap-1"><FaPhone className="text-carefd-teal" /> {member.phone}</span>
                      )}
                      {member.email && (
                        <span className="flex items-center gap-1"><FaEnvelope className="text-carefd-teal" /> {member.email}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(member)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><FaEdit /></button>
                  <button onClick={() => handleDelete(member.member_id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FaTrash /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderTeam;
