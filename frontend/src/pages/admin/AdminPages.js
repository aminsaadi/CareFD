import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  FiPlus, FiEdit2, FiTrash2, FiEye, FiFileText, FiSave,
  FiX, FiCheckCircle, FiLoader
} from 'react-icons/fi';

const AdminPages = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [currentPage, setCurrentPage] = useState({
    title: '',
    slug: '',
    content: '',
    meta_description: '',
    is_published: true
  });
  const { confirmState, confirm, closeConfirm } = useConfirm();

  // ReactQuill modules configuration
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],
      ['clean']
    ],
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'link', 'image', 'video',
    'blockquote', 'code-block'
  ];

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/pages');
      setPages(response.data.pages || []);
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      toast.error('שגיאה בטעינת הדפים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const fetchPageContent = async (pageId) => {
    try {
      const response = await api.get(`/pages/${pageId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch page content:', error);
      return null;
    }
  };

  const savePage = async () => {
    if (!currentPage.title.trim() || !currentPage.slug.trim()) {
      toast.error('נא למלא כותרת ונתיב');
      return;
    }

    setSaving(true);
    try {
      if (editingPage) {
        await api.put(`/admin/pages/${editingPage}`, currentPage);
        toast.success('הדף עודכן בהצלחה');
      } else {
        await api.post('/admin/pages', currentPage);
        toast.success('הדף נוצר בהצלחה');
      }
      setShowEditor(false);
      setEditingPage(null);
      setCurrentPage({ title: '', slug: '', content: '', meta_description: '', is_published: true });
      fetchPages();
    } catch (error) {
      console.error('Failed to save page:', error);
      toast.error('שגיאה בשמירת הדף');
    } finally {
      setSaving(false);
    }
  };

  const deletePage = async (pageId) => {
    const confirmed = await confirm({
      title: 'מחיקת דף',
      message: 'האם אתה בטוח שברצונך למחוק דף זה? פעולה זו לא ניתנת לביטול.',
      type: 'danger',
      confirmText: 'מחק',
      cancelText: 'ביטול'
    });
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/admin/pages/${pageId}`);
      toast.success('הדף נמחק בהצלחה');
      fetchPages();
    } catch (error) {
      console.error('Failed to delete page:', error);
      toast.error('שגיאה במחיקת הדף');
    }
  };

  const togglePublish = async (page) => {
    try {
      await api.put(`/admin/pages/${page.page_id}`, { is_published: !page.is_published });
      toast.success(page.is_published ? 'הדף הועבר לטיוטה' : 'הדף פורסם');
      fetchPages();
    } catch (error) {
      console.error('Failed to toggle publish:', error);
      toast.error('שגיאה בעדכון סטטוס');
    }
  };

  const openEditor = async (page = null) => {
    if (page) {
      setEditingPage(page.page_id);
      // Fetch full page content
      const fullPage = await fetchPageContent(page.slug);
      setCurrentPage({
        title: page.title,
        slug: page.slug,
        content: fullPage?.content || page.content || '',
        meta_description: page.meta_description || '',
        is_published: page.is_published
      });
    } else {
      setEditingPage(null);
      setCurrentPage({ title: '', slug: '', content: '', meta_description: '', is_published: true });
    }
    setShowEditor(true);
  };

  const handleSlugChange = (value) => {
    // Convert to URL-friendly slug
    const slug = value.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setCurrentPage(prev => ({ ...prev, slug }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carefd-navy">דפים סטטיים</h1>
            <p className="text-carefd-slate mt-1">ניהול דפי תוכן קבועים באתר</p>
          </div>
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 bg-carefd-teal text-carefd-navy rounded-lg hover:bg-carefd-teal/90 transition"
            data-testid="create-page-btn"
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
                <th className="text-right py-4 px-6 text-carefd-slate font-medium text-sm">כותרת</th>
                <th className="text-right py-4 px-6 text-carefd-slate font-medium text-sm">נתיב</th>
                <th className="text-right py-4 px-6 text-carefd-slate font-medium text-sm">סטטוס</th>
                <th className="text-right py-4 px-6 text-carefd-slate font-medium text-sm">עדכון אחרון</th>
                <th className="text-right py-4 px-6 text-carefd-slate font-medium text-sm">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="w-8 h-8 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-carefd-slate">
                    <FiFileText className="mx-auto mb-3" size={32} />
                    אין דפים. צור דף ראשון.
                  </td>
                </tr>
              ) : (
                pages.map((page) => (
                  <tr key={page.page_id} className="border-b border-gray-100/50 hover:bg-gray-50/30 transition" data-testid={`page-row-${page.slug}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-carefd-teal/20 rounded-lg flex items-center justify-center">
                          <FiFileText className="text-carefd-teal" size={18} />
                        </div>
                        <span className="text-carefd-navy font-medium">{page.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <code className="text-carefd-slate bg-gray-50 px-2 py-1 rounded text-sm">/{page.slug}</code>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => togglePublish(page)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
                          page.is_published 
                            ? 'bg-emerald-500/20 text-emerald-600' 
                            : 'bg-gray-100 text-carefd-slate'
                        }`}
                        data-testid={`toggle-publish-${page.slug}`}
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
                    <td className="py-4 px-6 text-carefd-slate text-sm">
                      {page.updated_at ? new Date(page.updated_at).toLocaleDateString('he-IL') : '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-carefd-slate hover:text-carefd-navy hover:bg-gray-50 rounded-lg transition"
                          title="צפה בדף"
                          data-testid={`view-page-${page.slug}`}
                        >
                          <FiEye size={16} />
                        </a>
                        <button
                          onClick={() => openEditor(page)}
                          className="p-2 text-carefd-slate hover:text-carefd-teal hover:bg-carefd-teal/10 rounded-lg transition"
                          title="ערוך"
                          data-testid={`edit-page-${page.slug}`}
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => deletePage(page.page_id)}
                          className="p-2 text-carefd-slate hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                          title="מחק"
                          data-testid={`delete-page-${page.slug}`}
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
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-carefd-navy">
                {editingPage ? 'עריכת דף' : 'דף חדש'}
              </h2>
              <button
                onClick={() => setShowEditor(false)}
                className="p-2 text-carefd-slate hover:text-carefd-navy hover:bg-gray-50 rounded-lg transition"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-carefd-slate mb-2">כותרת הדף *</label>
                  <input
                    type="text"
                    value={currentPage.title}
                    onChange={(e) => setCurrentPage(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="לדוגמה: אודות"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                    data-testid="page-title-input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-carefd-slate mb-2">נתיב (Slug) *</label>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden focus-within:border-carefd-teal focus-within:ring-1 focus-within:ring-carefd-teal">
                    <span className="px-3 text-carefd-gray">/</span>
                    <input
                      type="text"
                      value={currentPage.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="about"
                      className="flex-1 bg-transparent py-2.5 text-carefd-navy placeholder-carefd-gray outline-none"
                      dir="ltr"
                      data-testid="page-slug-input"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-carefd-slate mb-2">תיאור מטא (SEO)</label>
                <input
                  type="text"
                  value={currentPage.meta_description}
                  onChange={(e) => setCurrentPage(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="תיאור קצר לתוצאות חיפוש..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  data-testid="page-meta-input"
                />
              </div>

              <div>
                <label className="block text-sm text-carefd-slate mb-2">תוכן הדף</label>
                <div className="quill-rtl border border-gray-200 rounded-lg overflow-hidden" data-testid="page-content-editor">
                  <ReactQuill
                    theme="snow"
                    value={currentPage.content}
                    onChange={(content) => setCurrentPage(prev => ({ ...prev, content }))}
                    modules={modules}
                    formats={formats}
                    placeholder="כתוב את תוכן הדף כאן..."
                    style={{ minHeight: '300px' }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentPage.is_published}
                    onChange={(e) => setCurrentPage(prev => ({ ...prev, is_published: e.target.checked }))}
                    className="sr-only peer"
                    data-testid="page-publish-toggle"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-carefd-teal"></div>
                </label>
                <span className="text-carefd-slate">פרסם דף (גלוי לציבור)</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => setShowEditor(false)}
                className="px-6 py-2.5 bg-gray-100 text-carefd-navy rounded-lg hover:bg-gray-200 transition"
                data-testid="cancel-page-btn"
              >
                ביטול
              </button>
              <button
                onClick={savePage}
                disabled={!currentPage.title.trim() || !currentPage.slug.trim() || saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-carefd-teal text-carefd-navy rounded-lg hover:bg-carefd-teal/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="save-page-btn"
              >
                {saving ? (
                  <>
                    <FiLoader className="animate-spin" size={18} />
                    שומר...
                  </>
                ) : (
                  <>
                    <FiSave size={18} />
                    שמור
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
      />

      {/* Custom styles for RTL Quill editor */}
      <style>{`
        .quill-rtl .ql-editor {
          direction: rtl;
          text-align: right;
          min-height: 300px;
        }
        .quill-rtl .ql-toolbar {
          direction: ltr;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }
        .quill-rtl .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .quill-rtl .ql-editor.ql-blank::before {
          right: 15px;
          left: auto;
        }
      `}</style>
    </AdminLayout>
  );
};

export default AdminPages;
