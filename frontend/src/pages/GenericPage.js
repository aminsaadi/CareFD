import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';

const GenericPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/pages/${slug}`);
        setPage(response.data);
      } catch (error) {
        setPage(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : page ? (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{page.title}</h1>
            <div 
              className="prose prose-lg max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">הדף לא נמצא</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default GenericPage;
