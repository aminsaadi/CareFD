import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  FiFileText, FiEdit2, FiSave, FiX, FiEye, FiEyeOff, FiRefreshCw, FiCheck
} from 'react-icons/fi';

const AdminStaticPages = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    slug: '',
    content: '',
    meta_description: '',
    is_published: true
  });

  // Quill editor modules
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

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
      toast.error('שגיאה בטעינת הדפים');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPage = async (page) => {
    setSelectedPage(page);
    setEditForm({
      title: page.title || '',
      slug: page.slug || '',
      content: page.content || '',
      meta_description: page.meta_description || '',
      is_published: page.is_published !== false
    });
  };

  const handleSave = async () => {
    if (!selectedPage) return;
    
    setSaving(true);
    try {
      await api.put(`/admin/pages/${selectedPage.page_id}`, editForm);
      toast.success('הדף נשמר בהצלחה!');
      fetchPages();
    } catch (error) {
      console.error('Failed to save page:', error);
      toast.error('שגיאה בשמירת הדף');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (page) => {
    try {
      await api.put(`/admin/pages/${page.page_id}`, {
        ...page,
        is_published: !page.is_published
      });
      toast.success(page.is_published ? 'הדף הוסתר' : 'הדף פורסם');
      fetchPages();
    } catch (error) {
      toast.error('שגיאה בעדכון הדף');
    }
  };

  const getPageIcon = (slug) => {
    switch (slug) {
      case 'about': return '📖';
      case 'privacy': return '🔒';
      case 'terms': return '📜';
      case 'contact': return '📧';
      default: return '📄';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-carefd-navy">ניהול דפים סטטיים</h1>
            <p className="text-carefd-gray mt-1">ערוך את תוכן הדפים הקבועים באתר</p>
          </div>
          <button
            onClick={fetchPages}
            className="flex items-center gap-2 px-4 py-2 bg-carefd-teal-pale text-carefd-teal rounded-lg hover:bg-carefd-teal hover:text-white transition"
          >
            <FiRefreshCw />
            רענן
          </button>
        </div>

        <div className="flex gap-6">
          {/* Pages List */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-carefd-navy text-white px-4 py-3 font-bold">
                דפים זמינים
              </div>
              {loading ? (
                <div className="p-4 text-center">
                  <div className="w-8 h-8 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {pages.map((page) => (
                    <button
                      key={page.page_id}
                      onClick={() => handleSelectPage(page)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-carefd-teal-pale/30 transition ${
                        selectedPage?.page_id === page.page_id ? 'bg-carefd-teal-pale/50' : ''
                      }`}
                    >
                      <span className="text-xl">{getPageIcon(page.slug)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-carefd-navy truncate">{page.title}</p>
                        <p className="text-xs text-carefd-gray">/{page.slug}</p>
                      </div>
                      {page.is_published === false && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">טיוטה</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1">
            {selectedPage ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Editor Header */}
                <div className="bg-gray-50 border-b px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getPageIcon(selectedPage.slug)}</span>
                    <div>
                      <h2 className="text-lg font-bold text-carefd-navy">עריכת: {editForm.title}</h2>
                      <p className="text-sm text-carefd-gray">/{editForm.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTogglePublish(selectedPage)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                        editForm.is_published 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                    >
                      {editForm.is_published ? <FiEye /> : <FiEyeOff />}
                      {editForm.is_published ? 'מפורסם' : 'טיוטה'}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-carefd-teal text-white rounded-lg hover:bg-carefd-teal-medium transition disabled:opacity-50"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiSave />
                      )}
                      שמור
                    </button>
                  </div>
                </div>

                {/* Form */}
                <div className="p-6 space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-bold text-carefd-navy mb-2">כותרת הדף</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-carefd-teal focus:outline-none"
                    />
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-sm font-bold text-carefd-navy mb-2">תיאור לחיפוש (SEO)</label>
                    <textarea
                      value={editForm.meta_description}
                      onChange={(e) => setEditForm({ ...editForm, meta_description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-carefd-teal focus:outline-none resize-none"
                      placeholder="תיאור קצר של הדף לתוצאות חיפוש..."
                    />
                  </div>

                  {/* Content Editor */}
                  <div>
                    <label className="block text-sm font-bold text-carefd-navy mb-2">תוכן הדף</label>
                    <div className="border-2 border-gray-200 rounded-xl overflow-hidden" dir="rtl">
                      <ReactQuill
                        theme="snow"
                        value={editForm.content}
                        onChange={(content) => setEditForm({ ...editForm, content })}
                        modules={modules}
                        formats={formats}
                        placeholder="התחל לכתוב את תוכן הדף..."
                        style={{ minHeight: '400px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <FiFileText className="text-6xl text-carefd-teal-pale mx-auto mb-4" />
                <h3 className="text-xl font-bold text-carefd-navy mb-2">בחר דף לעריכה</h3>
                <p className="text-carefd-gray">לחץ על אחד הדפים בצד ימין כדי להתחיל לערוך</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom styles for Quill RTL */}
      <style>{`
        .ql-editor {
          direction: rtl;
          text-align: right;
          min-height: 350px;
          font-size: 16px;
          line-height: 1.8;
        }
        .ql-toolbar {
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          border-color: #e5e7eb;
          background: #f9fafb;
        }
        .ql-container {
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          border-color: #e5e7eb;
          font-family: inherit;
        }
        .ql-snow .ql-picker {
          text-align: right;
        }
        .ql-snow .ql-tooltip {
          z-index: 50;
        }
      `}</style>
    </AdminLayout>
  );
};

export default AdminStaticPages;
