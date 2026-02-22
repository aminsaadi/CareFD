import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import {
  FiPlus, FiEdit2, FiTrash2, FiEye, FiFileText, FiSave,
  FiX, FiGlobe, FiCheckCircle
} from 'react-icons/fi';

const AdminPages = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [currentPage, setCurrentPage] = useState({
    title: '',
    slug: '',
    content: '',
    meta_description: '',
    is_published: true
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/pages');
      setPages(response.data.pages || []);
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      // Demo data
      setPages([
        { page_id: 'page_1', title: 'אודות', slug: 'about', is_published: true, updated_at: new Date().toISOString() },
        { page_id: 'page_2', title: 'תנאי שימוש', slug: 'terms', is_published: true, updated_at: new Date().toISOString() },
        { page_id: 'page_3', title: 'מדיניות פרטיות', slug: 'privacy', is_published: true, updated_at: new Date().toISOString() },
        { page_id: 'page_4', title: 'צור קשר', slug: 'contact', is_published: true, updated_at: new Date().toISOString() },
        { page_id: 'page_5', title: 'שאלות נפוצות', slug: 'faq', is_published: false, updated_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const savePage = async () => {
    try {
      if (editingPage) {
        await api.put(`/admin/pages/${editingPage}`, currentPage);
      } else {
        await api.post('/admin/pages', currentPage);
      }
      setShowEditor(false);
      setEditingPage(null);
      setCurrentPage({ title: '', slug: '', content: '', meta_description: '', is_published: true });
      fetchPages();
    } catch (error) {
      console.error('Failed to save page:', error);
      // Demo - add locally
      setPages(prev => [...prev, { 
        page_id: `page_${Date.now()}`, 
        ...currentPage,
        updated_at: new Date().toISOString()
      }]);
      setShowEditor(false);
    }
  };

  const deletePage = async (pageId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק דף זה?')) return;
    try {
      await api.delete(`/admin/pages/${pageId}`);
      fetchPages();
    } catch (error) {
      console.error('Failed to delete page:', error);
      setPages(prev => prev.filter(p => p.page_id !== pageId));
    }
  };

  const togglePublish = async (page) => {
    try {
      await api.put(`/admin/pages/${page.page_id}`, { is_published: !page.is_published });
      fetchPages();
    } catch (error) {
      console.error('Failed to toggle publish:', error);
      setPages(prev => prev.map(p => 
        p.page_id === page.page_id ? { ...p, is_published: !p.is_published } : p
      ));
    }
  };

  const openEditor = (page = null) => {
    if (page) {
      setEditingPage(page.page_id);
      setCurrentPage({
        title: page.title,
        slug: page.slug,
        content: page.content || '',
        meta_description: page.meta_description || '',
        is_published: page.is_published
      });
    } else {
      setEditingPage(null);
      setCurrentPage({ title: '', slug: '', content: '', meta_description: '', is_published: true });
    }
    setShowEditor(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carelink-navy">דפים סטטיים</h1>
            <p className="text-carelink-slate mt-1">ניהול דפי תוכן קבועים באתר</p>
          </div>
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 bg-carelink-teal text-carelink-navy rounded-lg hover:bg-carelink-teal/90 transition"
          >
            <FiPlus size={18} />
            דף חדש
          </button>
        </div>

        {/* Pages List */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right py-4 px-6 text-carelink-slate font-medium text-sm">כותרת</th>
                <th className="text-right py-4 px-6 text-carelink-slate font-medium text-sm">נתיב</th>
                <th className="text-right py-4 px-6 text-carelink-slate font-medium text-sm">סטטוס</th>
                <th className="text-right py-4 px-6 text-carelink-slate font-medium text-sm">עדכון אחרון</th>
                <th className="text-right py-4 px-6 text-carelink-slate font-medium text-sm">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="w-8 h-8 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-carelink-slate">
                    <FiFileText className="mx-auto mb-3" size={32} />
                    אין דפים. צור דף ראשון.
                  </td>
                </tr>
              ) : (
                pages.map((page) => (
                  <tr key={page.page_id} className="border-b border-gray-100/50 hover:bg-gray-50/30 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-carelink-teal/20 rounded-lg flex items-center justify-center">
                          <FiFileText className="text-carelink-teal" size={18} />
                        </div>
                        <span className="text-carelink-navy font-medium">{page.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <code className="text-carelink-slate bg-gray-50 px-2 py-1 rounded text-sm">/{page.slug}</code>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => togglePublish(page)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
                          page.is_published 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-gray-100/50 text-carelink-slate'
                        }`}
                      >
                        {page.is_published ? (
                          <>
                            <FiCheckCircle size={14} />
                            מפורסם
                          </>
                        ) : (
                          <>
                            <FiX size={14} />
                            טיוטה
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-carelink-slate text-sm">
                      {page.updated_at ? new Date(page.updated_at).toLocaleDateString('he-IL') : '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-carelink-slate hover:text-carelink-navy hover:bg-gray-50 rounded-lg transition"
                        >
                          <FiEye size={16} />
                        </a>
                        <button
                          onClick={() => openEditor(page)}
                          className="p-2 text-carelink-slate hover:text-carelink-teal hover:bg-carelink-teal/10 rounded-lg transition"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => deletePage(page.page_id)}
                          className="p-2 text-carelink-slate hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
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
      </div>

      {/* Page Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-carelink-navy">
                {editingPage ? 'עריכת דף' : 'דף חדש'}
              </h2>
              <button
                onClick={() => setShowEditor(false)}
                className="p-2 text-carelink-slate hover:text-carelink-navy hover:bg-gray-50 rounded-lg transition"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-carelink-slate mb-2">כותרת הדף</label>
                  <input
                    type="text"
                    value={currentPage.title}
                    onChange={(e) => setCurrentPage(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="לדוגמה: אודות"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-carelink-slate mb-2">נתיב (Slug)</label>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden focus-within:border-carelink-teal focus-within:ring-1 focus-within:ring-indigo-500">
                    <span className="px-3 text-carelink-gray">/</span>
                    <input
                      type="text"
                      value={currentPage.slug}
                      onChange={(e) => setCurrentPage(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                      placeholder="about"
                      className="flex-1 bg-transparent py-2.5 text-carelink-navy placeholder-carelink-gray outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-carelink-slate mb-2">תיאור מטא (SEO)</label>
                <input
                  type="text"
                  value={currentPage.meta_description}
                  onChange={(e) => setCurrentPage(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="תיאור קצר לתוצאות חיפוש..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-carelink-slate mb-2">תוכן הדף</label>
                <textarea
                  value={currentPage.content}
                  onChange={(e) => setCurrentPage(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="כתוב את תוכן הדף כאן... (תומך ב-HTML)"
                  rows={12}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none resize-none font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentPage.is_published}
                    onChange={(e) => setCurrentPage(prev => ({ ...prev, is_published: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-carelink-teal"></div>
                </label>
                <span className="text-carelink-slate">פרסם דף (גלוי לציבור)</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => setShowEditor(false)}
                className="px-6 py-2.5 bg-gray-50 text-carelink-navy rounded-lg hover:bg-gray-100 transition"
              >
                ביטול
              </button>
              <button
                onClick={savePage}
                disabled={!currentPage.title.trim() || !currentPage.slug.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-carelink-teal text-carelink-navy rounded-lg hover:bg-carelink-teal/90 transition disabled:opacity-50"
              >
                <FiSave size={18} />
                שמור
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPages;
