"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import api from '@/lib/api-client';

const VerificationDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const documentTypes = [
    { value: 'id_card', label: 'תעודת זהות', icon: FileText },
    { value: 'license', label: 'רישיון מקצועי', icon: FileText },
    { value: 'certificate', label: 'תעודה מקצועית', icon: FileText },
    { value: 'diploma', label: 'תואר/דיפלומה', icon: FileText },
    { value: 'other', label: 'מסמך אחר', icon: FileText }
  ];

  const [selectedType, setSelectedType] = useState('id_card');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/providers/documents');
      setDocuments(data.documents || []);
      setVerificationStatus(data.verification_status || 'pending');
      setVerificationNotes(data.verification_notes || '');
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('הקובץ גדול מדי. גודל מקסימלי: 10MB');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('סוג קובץ לא נתמך. יש להעלות PDF או תמונה (JPG, PNG)');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // First upload the file
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Then register the document
      await api.post('/providers/documents', {
        document_type: selectedType,
        file_url: uploadResponse.data.url,
        file_name: file.name
      });

      // Refresh documents list
      await fetchDocuments();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'שגיאה בהעלאת המסמך');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'ממתין לבדיקה' },
      approved: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'אושר' },
      rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'נדחה' },
      documents_submitted: { color: 'bg-blue-100 text-blue-700', icon: FileText, label: 'מסמכים הוגשו' },
      verified: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'מאומת' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">מסמכי אימות</h2>
            <p className="text-sm text-gray-500 mt-1">
              העלה מסמכים לאימות הפרופיל שלך
            </p>
          </div>
          {getStatusBadge(verificationStatus)}
        </div>
        
        {verificationNotes && (
          <div className={`mt-4 p-3 rounded-lg ${
            verificationStatus === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
          }`}>
            <p className="text-sm">{verificationNotes}</p>
          </div>
        )}
      </div>

      {/* Upload Section */}
      {verificationStatus !== 'verified' && (
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              data-testid="document-type-select"
            >
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileUpload}
              className="hidden"
              id="document-upload"
            />
            
            <label
              htmlFor="document-upload"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                uploading 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'מעלה...' : 'העלה מסמך'}
            </label>
          </div>
          
          {error && (
            <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          <p className="mt-2 text-xs text-gray-500">
            פורמטים נתמכים: PDF, JPG, PNG. גודל מקסימלי: 10MB
          </p>
        </div>
      )}

      {/* Documents List */}
      <div className="p-6">
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>לא הועלו מסמכים עדיין</p>
            <p className="text-sm">העלה מסמכים כדי להתחיל בתהליך האימות</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc, index) => {
              const docType = documentTypes.find(t => t.value === doc.document_type);
              
              return (
                <div
                  key={doc.document_id || index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <FileText className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{docType?.label || doc.document_type}</p>
                      <p className="text-sm text-gray-500">{doc.file_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(doc.status)}
                    {doc.rejection_reason && (
                      <span className="text-xs text-red-600">{doc.rejection_reason}</span>
                    )}
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-700 text-sm"
                    >
                      צפה
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-6 bg-blue-50 border-t">
        <h3 className="font-medium text-blue-900 mb-2">מסמכים נדרשים לאימות:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• תעודת זהות (חובה)</li>
          <li>• רישיון מקצועי / תעודה מקצועית</li>
          <li>• אישורים רלוונטיים נוספים (אופציונלי)</li>
        </ul>
      </div>
    </div>
  );
};

export default VerificationDocuments;
