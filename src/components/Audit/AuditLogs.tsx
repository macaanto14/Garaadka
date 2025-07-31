import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, Activity, Download, Eye, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../store';
import { AuditLog, AuditStats } from '../../types';
import { auditAPI } from '../../services/api';

const AuditLogs: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch audit logs and stats
  const fetchAuditData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare date filters based on selected range
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateRange) {
        case 'today':
          startDate = today.toISOString().split('T')[0];
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekAgo.toISOString().split('T')[0];
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          startDate = monthAgo.toISOString().split('T')[0];
          break;
        case 'all':
        default:
          // No date filter
          break;
      }

      // Prepare action filter
      let actionType: string | undefined;
      if (selectedAction !== 'all') {
        switch (selectedAction) {
          case 'added':
            actionType = 'INSERT';
            break;
          case 'updated':
            actionType = 'UPDATE';
            break;
          case 'deleted':
            actionType = 'DELETE';
            break;
          default:
            actionType = selectedAction;
            break;
        }
      }

      // Fetch logs and stats in parallel
      const [logsResponse, statsResponse] = await Promise.all([
        auditAPI.getAll({
          action_type: actionType,
          start_date: startDate,
          end_date: endDate,
          limit: 100,
          offset: 0
        }),
        auditAPI.getStats()
      ]);

      setAuditLogs(logsResponse.audit_logs || []);
      setAuditStats(statsResponse);
    } catch (err: any) {
      console.error('Error fetching audit data:', err);
      setError(err.message || 'Failed to fetch audit data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchAuditData();
  }, [selectedAction, dateRange]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Generate user-friendly status from action_type and table_name
  const generateStatus = (log: AuditLog) => {
    if (log.status) return log.status;
    
    const action = log.action_type?.toLowerCase();
    const table = log.table_name?.toLowerCase();
    
    if (action === 'insert') {
      if (table === 'customers') return 'Added a Customer';
      if (table === 'orders') return 'Created Order';
      if (table === 'payments') return 'Processed Payment';
      return `Created ${table}`;
    } else if (action === 'update') {
      if (table === 'orders') return 'Updated Order Status';
      if (table === 'customers') return 'Updated Customer';
      return `Updated ${table}`;
    } else if (action === 'delete') {
      return `Deleted ${table}`;
    }
    
    return log.action_type || 'Unknown Action';
  };

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

  // Filter logs based on search term
  const filteredLogs = auditLogs.filter(log => {
    const status = generateStatus(log);
    const matchesSearch = log.emp_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         status.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.table_name && log.table_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Calculate active users from current logs
  const activeUsers = new Set(auditLogs.map(log => log.emp_id)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading audit logs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <div className="text-red-600">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Audit Logs</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button 
              onClick={fetchAuditData}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Activities</p>
              <p className="text-2xl font-bold text-blue-600">{auditStats?.totalLogs || 0}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
            </div>
            <User className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Today's Actions</p>
              <p className="text-2xl font-bold text-orange-600">{auditStats?.todayLogs || 0}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">This Week</p>
              <p className="text-2xl font-bold text-purple-600">{auditStats?.weekLogs || 0}</p>
            </div>
            <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">📊</span>
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
          <button 
            onClick={fetchAuditData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
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
                <th className="text-left py-3 px-4 font-medium text-gray-900">Table</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Date & Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-gray-500">
                    No audit logs found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const status = generateStatus(log);
                  return (
                    <tr key={log.audit_id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="py-4 px-4">
                        <span className="font-medium text-blue-600">#{log.audit_id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="bg-blue-500 text-white rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium">
                            {log.emp_id.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{log.emp_id}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getActionIcon(status)}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(status)}`}>
                            {status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-600 capitalize">{log.table_name || 'N/A'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900">{formatDate(log.date)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;