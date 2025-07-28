import React, { useState } from 'react';
import { Search, Filter, Calendar, User, Activity, Download, Eye } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { AuditLog } from '../../types';

const AuditLogs: React.FC = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [dateRange, setDateRange] = useState('today');

  // Mock data based on database schema
  const auditLogs: AuditLog[] = [
    {
      auditId: 1,
      empId: 'admin',
      date: '10:30:15 / Jan 15, 2024',
      status: 'Added a Customer'
    },
    {
      auditId: 2,
      empId: 'admin',
      date: '11:45:22 / Jan 15, 2024',
      status: 'Created Order #1204'
    },
    {
      auditId: 3,
      empId: 'staff1',
      date: '14:20:10 / Jan 15, 2024',
      status: 'Updated Order Status'
    },
    {
      auditId: 4,
      empId: 'admin',
      date: '15:30:45 / Jan 15, 2024',
      status: 'Processed Payment'
    },
    {
      auditId: 5,
      empId: 'manager',
      date: '16:15:30 / Jan 15, 2024',
      status: 'Generated Report'
    }
  ];

  const getActionColor = (action: string) => {
    if (action.includes('Added') || action.includes('Created')) return 'bg-green-100 text-green-800';
    if (action.includes('Updated') || action.includes('Modified')) return 'bg-blue-100 text-blue-800';
    if (action.includes('Deleted') || action.includes('Removed')) return 'bg-red-100 text-red-800';
    if (action.includes('Payment') || action.includes('Processed')) return 'bg-purple-100 text-purple-800';
    if (action.includes('Report') || action.includes('Generated')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('Added') || action.includes('Created')) return '✅';
    if (action.includes('Updated') || action.includes('Modified')) return '✏️';
    if (action.includes('Deleted') || action.includes('Removed')) return '🗑️';
    if (action.includes('Payment') || action.includes('Processed')) return '💳';
    if (action.includes('Report') || action.includes('Generated')) return '📊';
    return '📝';
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.status.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = selectedAction === 'all' || log.status.toLowerCase().includes(selectedAction.toLowerCase());
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Activities</p>
              <p className="text-2xl font-bold text-blue-600">{auditLogs.length}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{new Set(auditLogs.map(log => log.empId)).size}</p>
            </div>
            <User className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Today's Actions</p>
              <p className="text-2xl font-bold text-orange-600">{auditLogs.filter(log => log.date.includes('Jan 15, 2024')).length}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">System Health</p>
              <p className="text-2xl font-bold text-purple-600">98%</p>
            </div>
            <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search audit logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="added">Added/Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
              <option value="payment">Payment</option>
              <option value="report">Report</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Logs</span>
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Log ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Date & Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.auditId} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-4 px-4">
                    <span className="font-medium text-blue-600">#{log.auditId}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-500 text-white rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium">
                        {log.empId.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{log.empId}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getActionIcon(log.status)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.status)}`}>
                        {log.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-900">{log.date}</span>
                  </td>
                  <td className="py-4 px-4">
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;