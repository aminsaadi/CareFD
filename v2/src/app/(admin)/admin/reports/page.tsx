"use client";

import {  useState, useEffect  } from "react";
import api from "@/lib/api-client";
import { toast } from "sonner";
import {
  FiCalendar, FiTrendingUp, FiUsers, FiBriefcase,
  FiStar, FiDollarSign, FiBarChart2, FiPieChart
} from 'react-icons/fi';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function AdminReports() {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/admin/reports?period=${period}`);
      setReports(data);
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
      toast.error('שגיאה בטעינת הדוחות');
    } finally {
      setLoading(false);
    }
  };

  const periodOptions = [
    { value: 'week', label: 'שבוע אחרון' },
    { value: 'month', label: 'חודש אחרון' },
    { value: 'year', label: 'שנה אחרונה' }
  ];

  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="text-carefd-navy font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      
    );
  }

  return (
    <>
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carefd-navy">דוחות וסטטיסטיקות</h1>
            <p className="text-carefd-slate mt-1">ניתוח נתוני הפלטפורמה</p>
          </div>
          <div className="flex items-center gap-2">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  period === opt.value
                    ? 'bg-carefd-teal text-white shadow-md'
                    : 'bg-white text-carefd-slate border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        {reports?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-carefd-slate text-sm mb-1">
                <FiCalendar size={14} />
                הזמנות
              </div>
              <p className="text-2xl font-bold text-carefd-navy">{reports.summary.total_bookings}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-carefd-slate text-sm mb-1">
                <FiDollarSign size={14} />
                הכנסות
              </div>
              <p className="text-2xl font-bold text-emerald-500">₪{reports.summary.total_revenue?.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-carefd-slate text-sm mb-1">
                <FiUsers size={14} />
                משתמשים חדשים
              </div>
              <p className="text-2xl font-bold text-carefd-navy">{reports.summary.new_users}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-carefd-slate text-sm mb-1">
                <FiBriefcase size={14} />
                ספקים חדשים
              </div>
              <p className="text-2xl font-bold text-carefd-navy">{reports.summary.new_providers}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-carefd-slate text-sm mb-1">
                <FiStar size={14} />
                ביקורות
              </div>
              <p className="text-2xl font-bold text-carefd-navy">{reports.summary.new_reviews}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-carefd-slate text-sm mb-1">
                <FiStar size={14} />
                דירוג ממוצע
              </div>
              <p className="text-2xl font-bold text-amber-500">{reports.summary.avg_rating}</p>
            </div>
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bookings Timeline */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FiTrendingUp className="text-carefd-teal" size={20} />
              <h2 className="text-lg font-semibold text-carefd-navy">הזמנות לאורך זמן</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                <AreaChart data={reports?.bookings_timeline || []}>
                  <defs>
                    <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#19B8BA" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#19B8BA" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    name="הזמנות"
                    stroke="#19B8BA"
                    strokeWidth={2}
                    fill="url(#bookingsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FiPieChart className="text-carefd-teal" size={20} />
              <h2 className="text-lg font-semibold text-carefd-navy">התפלגות סטטוס הזמנות</h2>
            </div>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                <PieChart>
                  <Pie
                    data={reports?.status_distribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {(reports?.status_distribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Providers */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FiBarChart2 className="text-carefd-teal" size={20} />
              <h2 className="text-lg font-semibold text-carefd-navy">ספקים מובילים</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                <BarChart 
                  data={reports?.top_providers || []} 
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    width={75}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="bookings" 
                    name="הזמנות"
                    fill="#1E4D5F" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FiDollarSign className="text-emerald-500" size={20} />
              <h2 className="text-lg font-semibold text-carefd-navy">הכנסות לאורך זמן</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                <LineChart data={reports?.revenue_by_date || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `₪${value}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`₪${value}`, 'הכנסות']}
                    contentStyle={{ direction: 'rtl' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="הכנסות"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Stats Table */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-carefd-navy mb-4">סיכום מהיר</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right py-3 px-4 text-carefd-slate font-medium text-sm">מדד</th>
                  <th className="text-right py-3 px-4 text-carefd-slate font-medium text-sm">תקופה נוכחית</th>
                  <th className="text-right py-3 px-4 text-carefd-slate font-medium text-sm">שינוי</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-50">
                  <td className="py-3 px-4 text-carefd-navy">סה"כ הזמנות</td>
                  <td className="py-3 px-4 font-semibold text-carefd-navy">{reports?.summary?.total_bookings || 0}</td>
                  <td className="py-3 px-4">
                    <span className="text-carefd-gray text-sm">—</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-3 px-4 text-carefd-navy">הכנסות</td>
                  <td className="py-3 px-4 font-semibold text-emerald-500">₪{reports?.summary?.total_revenue?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4">
                    <span className="text-carefd-gray text-sm">—</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-3 px-4 text-carefd-navy">משתמשים חדשים</td>
                  <td className="py-3 px-4 font-semibold text-carefd-navy">{reports?.summary?.new_users || 0}</td>
                  <td className="py-3 px-4">
                    <span className="text-carefd-gray text-sm">—</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-carefd-navy">דירוג ממוצע</td>
                  <td className="py-3 px-4 font-semibold text-amber-500">{reports?.summary?.avg_rating || 0} ⭐</td>
                  <td className="py-3 px-4">
                    <span className="text-carefd-slate text-sm">יציב</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    
    </>
  );
};


