import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import {
  FiPlus, FiEdit2, FiTrash2, FiEye, FiImage, FiCalendar,
  FiTag, FiSave, FiX, FiCheckCircle, FiUser
} from 'react-icons/fi';

const AdminBlog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [currentPost, setCurrentPost] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    tags: [],
    is_published: false
  });
  const [newTag, setNewTag] = useState('');
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/blog');
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      // Demo data
      setPosts([
        { 
          post_id: 'post_1', 
          title: 'איך לבחור רופא משפחה מתאים', 
          slug: 'choose-family-doctor',
          excerpt: 'מדריך מקיף לבחירת רופא משפחה שיתאים לצרכים שלכם',
          is_published: true, 
          views: 1234,
          tags: ['בריאות', 'טיפים'],
          created_at: new Date().toISOString()
        },
        { 
          post_id: 'post_2', 
          title: '5 טיפים לשמירה על בריאות הנפש', 
          slug: 'mental-health-tips',
          excerpt: 'טיפים פשוטים לשמירה על הבריאות הנפשית בימים מאתגרים',
          is_published: true,
          views: 856,
          tags: ['בריאות הנפש', 'טיפים'],
          created_at: new Date().toISOString()
        },
        { 
          post_id: 'post_3', 
          title: 'חדשות מעולם הרפואה', 
          slug: 'medical-news',
          excerpt: 'סקירה של החידושים האחרונים בתחום הרפואה',
          is_published: false,
          views: 0,
          tags: ['חדשות'],
          created_at: new Date().toISOString()
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const savePost = async () => {
    try {
      if (editingPost) {
        await api.put(`/admin/blog/${editingPost}`, currentPost);
      } else {
        await api.post('/admin/blog', currentPost);
      }
      setShowEditor(false);
      setEditingPost(null);
      resetForm();
      fetchPosts();
    } catch (error) {
      console.error('Failed to save post:', error);
      // Demo - add locally
      setPosts(prev => [...prev, { 
        post_id: `post_${Date.now()}`, 
        ...currentPost,
        views: 0,
        created_at: new Date().toISOString()
      }]);
      setShowEditor(false);
      resetForm();
    }
  };

  const deletePost = async (postId) => {
    await confirm({
      title: 'מחיקת פוסט',
      message: 'האם אתה בטוח שברצונך למחוק פוסט זה?',
      type: 'danger',
      confirmText: 'מחק',
      cancelText: 'ביטול'
    });
    try {
      await api.delete(`/admin/blog/${postId}`);
      fetchPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
      setPosts(prev => prev.filter(p => p.post_id !== postId));
    }
  };

  const resetForm = () => {
    setCurrentPost({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      tags: [],
      is_published: false
    });
  };

  const openEditor = (post = null) => {
    if (post) {
      setEditingPost(post.post_id);
      setCurrentPost({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: post.content || '',
        featured_image: post.featured_image || '',
        tags: post.tags || [],
        is_published: post.is_published
      });
    } else {
      setEditingPost(null);
      resetForm();
    }
    setShowEditor(true);
  };

  const addTag = () => {
    if (newTag.trim() && !currentPost.tags.includes(newTag.trim())) {
      setCurrentPost(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setCurrentPost(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carefd-navy">ניהול בלוג</h1>
            <p className="text-carefd-slate mt-1">צור ונהל פוסטים בבלוג</p>
          </div>
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 bg-carefd-teal text-carefd-navy rounded-lg hover:bg-carefd-teal/90 transition"
          >
            <FiPlus size={18} />
            פוסט חדש
          </button>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <FiEdit2 className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-carefd-slate">אין פוסטים. צור את הפוסט הראשון!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div 
                key={post.post_id} 
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-carefd-teal/50 transition group"
              >
                {/* Image */}
                <div className="h-40 bg-gray-50 relative">
                  {post.featured_image ? (
                    <img 
                      src={post.featured_image} 
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiImage className="text-slate-600" size={32} />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium ${
                    post.is_published 
                      ? 'bg-emerald-500/90 text-carefd-navy' 
                      : 'bg-gray-100/90 text-carefd-slate'
                  }`}>
                    {post.is_published ? 'מפורסם' : 'טיוטה'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-carefd-navy font-medium mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-carefd-slate text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                  
                  {/* Tags */}
                  {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="bg-gray-50 text-carefd-slate px-2 py-0.5 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center justify-between text-sm text-carefd-gray">
                    <span className="flex items-center gap-1">
                      <FiEye size={14} />
                      {post.views || 0} צפיות
                    </span>
                    <span className="flex items-center gap-1">
                      <FiCalendar size={14} />
                      {new Date(post.created_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center border-t border-gray-100">
                  <button
                    onClick={() => openEditor(post)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-carefd-slate hover:text-carefd-teal hover:bg-carefd-teal/10 transition"
                  >
                    <FiEdit2 size={16} />
                    ערוך
                  </button>
                  <div className="w-px h-8 bg-gray-50"></div>
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-carefd-slate hover:text-carefd-navy hover:bg-gray-50/50 transition"
                  >
                    <FiEye size={16} />
                    צפה
                  </a>
                  <div className="w-px h-8 bg-gray-50"></div>
                  <button
                    onClick={() => deletePost(post.post_id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-carefd-slate hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    <FiTrash2 size={16} />
                    מחק
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-carefd-navy">
                {editingPost ? 'עריכת פוסט' : 'פוסט חדש'}
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
                  <label className="block text-sm text-carefd-slate mb-2">כותרת</label>
                  <input
                    type="text"
                    value={currentPost.title}
                    onChange={(e) => setCurrentPost(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="כותרת הפוסט..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-carefd-slate mb-2">נתיב (Slug)</label>
                  <input
                    type="text"
                    value={currentPost.slug}
                    onChange={(e) => setCurrentPost(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                    placeholder="post-url"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-carefd-slate mb-2">תקציר</label>
                <textarea
                  value={currentPost.excerpt}
                  onChange={(e) => setCurrentPost(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="תקציר קצר של הפוסט..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-carefd-slate mb-2">תמונה ראשית (URL)</label>
                <input
                  type="text"
                  value={currentPost.featured_image}
                  onChange={(e) => setCurrentPost(prev => ({ ...prev, featured_image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm text-carefd-slate mb-2">תגיות</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {currentPost.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-carefd-teal/20 text-carefd-teal px-3 py-1 rounded-lg text-sm"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-400">
                        <FiX size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="הוסף תגית..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-50 text-carefd-navy rounded-lg hover:bg-gray-100 transition"
                  >
                    הוסף
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-carefd-slate mb-2">תוכן</label>
                <textarea
                  value={currentPost.content}
                  onChange={(e) => setCurrentPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="כתוב את תוכן הפוסט כאן..."
                  rows={12}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentPost.is_published}
                    onChange={(e) => setCurrentPost(prev => ({ ...prev, is_published: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-carefd-teal"></div>
                </label>
                <span className="text-carefd-slate">פרסם עכשיו</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => setShowEditor(false)}
                className="px-6 py-2.5 bg-gray-50 text-carefd-navy rounded-lg hover:bg-gray-100 transition"
              >
                ביטול
              </button>
              <button
                onClick={savePost}
                disabled={!currentPost.title.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-carefd-teal text-carefd-navy rounded-lg hover:bg-carefd-teal/90 transition disabled:opacity-50"
              >
                <FiSave size={18} />
                שמור
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
    </AdminLayout>
  );
};

export default AdminBlog;
