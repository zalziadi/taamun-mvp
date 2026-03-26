'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockAgents = [
  {
    id: 1,
    name: 'وكيل معالجة النصوص',
    status: 'active',
    currentTask: 'تحليل محتوى اليوم الرابع',
    progress: 78,
    lastActivity: '2 دقيقة',
    tasksCompleted: 45,
  },
  {
    id: 2,
    name: 'وكيل التحقق من الجودة',
    status: 'active',
    currentTask: 'مراجعة التطبيقات',
    progress: 45,
    lastActivity: '1 دقيقة',
    tasksCompleted: 32,
  },
  {
    id: 3,
    name: 'وكيل قاعدة البيانات',
    status: 'idle',
    currentTask: 'في انتظار المهام',
    progress: 0,
    lastActivity: '15 دقيقة',
    tasksCompleted: 128,
  },
  {
    id: 4,
    name: 'وكيل الإشعارات',
    status: 'active',
    currentTask: 'إرسال تحديثات يومية',
    progress: 92,
    lastActivity: '30 ثانية',
    tasksCompleted: 267,
  },
  {
    id: 5,
    name: 'وكيل التقارير',
    status: 'error',
    currentTask: 'فشل في معالجة التقرير',
    progress: 25,
    lastActivity: '5 دقائق',
    tasksCompleted: 18,
  },
];

const mockActivityLog = [
  { id: 1, time: '14:32', agent: 'وكيل معالجة النصوص', action: 'بدء معالجة اليوم الرابع', type: 'start' },
  { id: 2, time: '14:31', agent: 'وكيل الإشعارات', action: 'تم إرسال 156 إشعار بنجاح', type: 'success' },
  { id: 3, time: '14:29', agent: 'وكيل التحقق من الجودة', action: 'اكتمل مراجعة 23 تطبيق', type: 'success' },
  { id: 4, time: '14:25', agent: 'وكيل التقارير', action: 'خطأ: انقطاع اتصال قاعدة البيانات', type: 'error' },
  { id: 5, time: '14:20', agent: 'وكيل معالجة النصوص', action: 'اكتمل تحليل 12 آية قرآنية', type: 'success' },
  { id: 6, time: '14:15', agent: 'وكيل قاعدة البيانات', action: 'تم حفظ 89 سجل جديد', type: 'success' },
];

const mockChartData = [
  { time: '09:00', completed: 12 },
  { time: '10:00', completed: 28 },
  { time: '11:00', completed: 45 },
  { time: '12:00', completed: 67 },
  { time: '13:00', completed: 89 },
  { time: '14:00', completed: 112 },
];

const StatusDot = ({ status }) => {
  const colors = {
    active: 'bg-green-500',
    idle: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  const labels = {
    active: 'نشط',
    idle: 'خامل',
    error: 'خطأ',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${colors[status]} animate-pulse`} />
      <span className="text-sm text-gray-600">{labels[status]}</span>
    </div>
  );
};

const AgentCard = ({ agent }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-right">{agent.name}</h3>
        <StatusDot status={agent.status} />
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 text-right mb-1">المهمة الحالية</p>
          <p className="text-sm text-gray-700 text-right">{agent.currentTask}</p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">{agent.progress}%</span>
            <span className="text-xs text-gray-500">التقدم</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                agent.status === 'error'
                  ? 'bg-red-500'
                  : agent.status === 'idle'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
              }`}
              style={{ width: `${agent.progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div className="text-right">
            <p className="text-xs text-gray-500">آخر نشاط</p>
            <p className="text-sm text-gray-700">{agent.lastActivity}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">المهام المكتملة</p>
            <p className="text-sm font-semibold text-gray-900">{agent.tasksCompleted}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityLogItem = ({ item }) => {
  const typeConfig = {
    success: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    start: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  };

  const config = typeConfig[item.type] || typeConfig.start;
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${config.bg}`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.color}`} />
      <div className="flex-1 text-right">
        <div className="flex justify-between items-start">
          <span className="text-xs text-gray-500">{item.time}</span>
          <p className="text-sm font-medium text-gray-900">{item.agent}</p>
        </div>
        <p className="text-sm text-gray-700 mt-1">{item.action}</p>
      </div>
    </div>
  );
};

export default function AgentDashboard() {
  const [agents, setAgents] = useState(mockAgents);
  const [activityLog, setActivityLog] = useState(mockActivityLog);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const activeAgents = agents.filter((a) => a.status === 'active').length;
  const totalAgents = agents.length;
  const totalTasksCompleted = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);
  const errorRate = ((agents.filter((a) => a.status === 'error').length / totalAgents) * 100).toFixed(1);

  const handleRefresh = () => {
    setAgents(
      agents.map((agent) => ({
        ...agent,
        progress: Math.min(100, agent.progress + Math.random() * 15),
        lastActivity: 'الآن',
      }))
    );
    setLastRefresh(new Date());
  };

  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(handleRefresh, 5000);
    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl" lang="ar">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">لوحة متابعة الإيجنت</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isAutoRefresh
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isAutoRefresh ? 'تحديث تلقائي: مفعّل' : 'تحديث تلقائي: معطّل'}
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="تحديث الآن"
            >
              <RefreshCw className="w-5 h-5 text-gray-700" />
            </button>
            <span className="text-xs text-gray-500">{lastRefresh.toLocaleTimeString('ar-SA')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 text-right mb-2">إجمالي الوكلاء</p>
            <p className="text-3xl font-bold text-gray-900 text-right">{totalAgents}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 text-right mb-2">وكلاء نشطة</p>
            <p className="text-3xl font-bold text-green-600 text-right">{activeAgents}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 text-right mb-2">المهام المكتملة</p>
            <p className="text-3xl font-bold text-blue-600 text-right">{totalTasksCompleted}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 text-right mb-2">معدل الأخطاء</p>
            <p className="text-3xl font-bold text-red-600 text-right">{errorRate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-right">حالة الوكلاء</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-right">سجل النشاط</h2>
              <div className="space-y-2">
                {activityLog.map((item) => (
                  <ActivityLogItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-right">إحصائيات اليوم</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-right">
              <p className="text-xs text-gray-600 mb-1">المهام المكتملة اليوم</p>
              <p className="text-lg font-bold text-blue-600">112</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
