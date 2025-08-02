import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Calendar, User, Activity, Download, Eye, RefreshCw, 
  ChevronLeft, ChevronRight, BarChart3, Clock, Database, AlertTriangle,
  FileText, Trash2, Plus, Settings, TrendingUp, Users, Shield
} from 'lucide-react';
import { useTranslation } from '../../store';
import { AuditLog, AuditStats } from '../../types';
import { auditAPI } from '../../services/api';

// Enhanced interfaces for better type safety
interface AuditLogResponse {
  audit_logs: AuditLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    current_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters: {
    table_name: string | null;
    action_type: string | null;
    emp_id: string | null;
    start_date: string | null;
    end_date: string | null;
    search: string | null;
    sort_by: string;
    sort_order: string;
  };
}

interface EnhancedAuditStats {
  total_logs: number;
  today_logs: number;
  weekly_logs: number;
  active_users_today: number;
  active_users_week: number;
  action_stats: Array<{ action_type: string; count: number }>;
  table_stats: Array<{ table_name: string; count: number }>;
  user_stats: Array<{ emp_id: string; count: number }>;
}

interface TimelineData {
  time_period: string;
  total_logs: number;
  create_count: number;
  update_count: number;
  delete_count: number;
  login_count: number;
  logout_count: number;
  unique_users: number;
  unique_tables: number;
}

const AuditLogs: React.FC = () => {
  const { t } = useTranslation();
  
  // State management
  const [auditData, setAuditData] = useState<AuditLogResponse | null>(null);
  const [auditStats, setAuditStats] = useState<EnhancedAuditStats | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'analytics' | 'users' | 'cleanup'>('logs');
  
  // Cleanup states
  const [retentionDays, setRetentionDays] = useState(365);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    table_name: '',
    action_type: '',
    emp_id: '',
    start_date: '',
    end_date: '',
    sort_by: 'audit_id',
    sort_order: 'DESC' as 'ASC' | 'DESC',
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current_page: 1,
    limit: 25,
    offset: 0,
  });

  // Fetch audit data with current filters and pagination
  const fetchAuditData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        ...filters,
        limit: pagination.limit,
        offset: pagination.offset,
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const [logsResponse, statsResponse] = await Promise.all([
        auditAPI.getAll(params),
        auditAPI.getStats()
      ]);

      setAuditData(logsResponse);
      setAuditStats(statsResponse);

      // Fetch timeline data for the last 30 days
      if (activeTab === 'analytics') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        try {
          const timeline = await auditAPI.getTimeline({
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            group_by: 'day'
          });
          setTimelineData(timeline.timeline_data || []);
        } catch (timelineError) {
          console.warn('Timeline data not available:', timelineError);
        }
      }

    } catch (err: any) {
      console.error('Error fetching audit data:', err);
      setError(err.message || 'Failed to fetch audit data');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination, activeTab]);

  // Initial data fetch and when dependencies change
  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current_page: 1, offset: 0 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    const newOffset = (page - 1) * pagination.limit;
    setPagination(prev => ({ 
      ...prev, 
      current_page: page, 
      offset: newOffset 
    }));
  };

  // Handle export
  const handleExport = async () => {
    try {
      const exportParams = { ...filters };
      Object.keys(exportParams).forEach(key => {
        if (exportParams[key] === '') {
          delete exportParams[key];
        }
      });

      const blob = await auditAPI.exportCSV(exportParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export audit logs');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      // Handle the custom date format from backend
      if (dateString.includes('/')) {
        return dateString;
      }
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

  // Generate user-friendly status
  const generateStatus = (log: AuditLog) => {
    if (log.status) return log.status;
    
    const action = log.action_type?.toLowerCase();
    const table = log.table_name?.toLowerCase();
    
    if (action === 'create' || action === 'insert') {
      if (table === 'customers') return 'Added Customer';
      if (table === 'orders') return 'Created Order';
      if (table === 'payments') return 'Processed Payment';
      return `Created ${table}`;
    } else if (action === 'update') {
      if (table === 'orders') return 'Updated Order';
      if (table === 'customers') return 'Updated Customer';
      return `Updated ${table}`;
    } else if (action === 'delete') {
      return `Deleted ${table}`;
    } else if (action === 'login') {
      return 'User Login';
    } else if (action === 'logout') {
      return 'User Logout';
    }
    
    return log.action_type || 'Unknown Action';
  };

  // Get action styling
  const getActionColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('add') || lowerAction.includes('creat') || lowerAction.includes('login')) 
      return 'bg-green-100 text-green-800 border-green-200';
    if (lowerAction.includes('updat') || lowerAction.includes('modif')) 
      return 'bg-blue-100 text-blue-800 border-blue-200';
    if (lowerAction.includes('delet') || lowerAction.includes('remov')) 
      return 'bg-red-100 text-red-800 border-red-200';
    if (lowerAction.includes('payment') || lowerAction.includes('process')) 
      return 'bg-purple-100 text-purple-800 border-purple-200';
    if (lowerAction.includes('logout')) 
      return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getActionIcon = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('add') || lowerAction.includes('creat')) return '✅';
    if (lowerAction.includes('updat') || lowerAction.includes('modif')) return '✏️';
    if (lowerAction.includes('delet') || lowerAction.includes('remov')) return '🗑️';
    if (lowerAction.includes('payment') || lowerAction.includes('process')) return '💳';
    if (lowerAction.includes('login')) return '🔐';
    if (lowerAction.includes('logout')) return '🚪';
    return '📝';
  };

  // View log details
  const viewLogDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  // Loading state
  if (loading && !auditData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading audit logs...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !auditData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-6 w-6 text-red-600" />
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
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Activities</p>
              <p className="text-2xl font-bold text-blue-600">{auditStats?.total_logs || 0}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Today's Actions</p>
              <p className="text-2xl font-bold text-green-600">{auditStats?.today_logs || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-purple-600">
                {auditStats?.user_stats?.length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Unique users</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Users Today</p>
              <p className="text-2xl font-bold text-purple-600">
                {auditStats?.active_users_today || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Users active today</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">This Week</p>
              <p className="text-2xl font-bold text-orange-600">{auditStats?.weekly_logs || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'logs', label: 'Audit Logs', icon: FileText },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'users', label: 'User Activity', icon: User },
              { id: 'cleanup', label: 'Maintenance', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'logs' && (
            <div className="space-y-6">
              {/* Enhanced Filters */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  />
                </div>

                <select
                  value={filters.action_type}
                  onChange={(e) => handleFilterChange('action_type', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGOUT">Logout</option>
                </select>

                <select
                  value={filters.table_name}
                  onChange={(e) => handleFilterChange('table_name', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Tables</option>
                  <option value="customers">Customers</option>
                  <option value="orders">Orders</option>
                  <option value="payments">Payments</option>
                  <option value="register">Register</option>
                  <option value="users">Users</option>
                </select>

                <input
                  type="text"
                  placeholder="Filter by user..."
                  value={filters.emp_id}
                  onChange={(e) => handleFilterChange('emp_id', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Date Range Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">From:</label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">To:</label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2 ml-auto">
                  <button 
                    onClick={fetchAuditData}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button 
                    onClick={handleExport}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Audit Logs Table */}
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">ID</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Table</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Record ID</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Date & Time</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {auditData?.audit_logs?.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 px-4 text-center">
                            <div className="flex flex-col items-center space-y-3">
                              <div className="bg-gray-100 rounded-full p-3">
                                <FileText className="h-8 w-8 text-gray-400" />
                              </div>
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">No audit logs found</h3>
                                <p className="text-gray-500 mt-1">
                                  {Object.values(filters).some(v => v) 
                                    ? 'Try adjusting your filters to see more results.'
                                    : 'No audit logs have been recorded yet.'
                                  }
                                </p>
                              </div>
                              {Object.values(filters).some(v => v) && (
                                <button
                                  onClick={() => {
                                    setFilters({
                                      search: '',
                                      table_name: '',
                                      action_type: '',
                                      emp_id: '',
                                      start_date: '',
                                      end_date: '',
                                      sort_by: 'audit_id',
                                      sort_order: 'DESC',
                                    });
                                  }}
                                  className="text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  Clear all filters
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        auditData?.audit_logs?.map((log) => {
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
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getActionColor(status)}`}>
                                    {status}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-gray-600 capitalize">{log.table_name || 'N/A'}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-gray-600">{log.record_id || 'N/A'}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-gray-900 text-sm">{formatDate(log.date)}</span>
                              </td>
                              <td className="py-4 px-4">
                                <button 
                                  onClick={() => viewLogDetails(log)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                                  title="View details"
                                >
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

              {/* Pagination */}
              {auditData?.pagination && auditData.pagination.total_pages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {auditData.pagination.offset + 1} to{' '}
                    {Math.min(auditData.pagination.offset + auditData.pagination.limit, auditData.pagination.total)} of{' '}
                    {auditData.pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(auditData.pagination.current_page - 1)}
                      disabled={!auditData.pagination.has_prev}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    <span className="px-3 py-2 text-sm font-medium">
                      Page {auditData.pagination.current_page} of {auditData.pagination.total_pages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(auditData.pagination.current_page + 1)}
                      disabled={!auditData.pagination.has_next}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Audit Analytics</h3>
              
              {/* Action Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Actions by Type</h4>
                  <div className="space-y-2">
                    {auditStats?.action_stats?.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{stat.action_type}</span>
                        <span className="font-medium">{stat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Activity by Table</h4>
                  <div className="space-y-2">
                    {auditStats?.table_stats?.slice(0, 5).map((stat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{stat.table_name}</span>
                        <span className="font-medium">{stat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Users */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Most Active Users</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {auditStats?.user_stats?.slice(0, 6).map((stat, index) => (
                    <div key={index} className="flex items-center space-x-3 bg-white rounded-lg p-3">
                      <div className="bg-blue-500 text-white rounded-full h-10 w-10 flex items-center justify-center text-sm font-medium">
                        {stat.emp_id.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{stat.emp_id}</p>
                        <p className="text-sm text-gray-500">{stat.count} actions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">User Activity</h3>
              <p className="text-gray-600">Select a user to view their detailed activity logs.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {auditStats?.user_stats?.map((user, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-lg font-medium">
                        {user.emp_id.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{user.emp_id}</h4>
                        <p className="text-sm text-gray-500">{user.count} total actions</p>
                      </div>
                      <button
                        onClick={() => handleFilterChange('emp_id', user.emp_id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cleanup' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Audit Log Maintenance</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Cleanup Old Logs</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      Remove audit logs older than a specified number of days to maintain database performance.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Cleanup Configuration</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Retention Period (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      value={retentionDays}
                      onChange={(e) => setRetentionDays(parseInt(e.target.value) || 365)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Logs older than this many days will be deleted
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleCleanup}
                    disabled={cleanupLoading}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className={`h-4 w-4 ${cleanupLoading ? 'animate-spin' : ''}`} />
                    <span>{cleanupLoading ? 'Cleaning up...' : 'Clean Up Old Logs'}</span>
                  </button>
                </div>
              </div>

              {/* Current Statistics */}
              {auditStats && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Current Audit Log Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{auditStats.total_logs}</p>
                      <p className="text-sm text-gray-600">Total Logs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{auditStats.today_logs}</p>
                      <p className="text-sm text-gray-600">Today's Logs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{auditStats.weekly_logs}</p>
                      <p className="text-sm text-gray-600">This Week</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{auditStats.user_stats?.length || 0}</p>
                      <p className="text-sm text-gray-600">Active Users</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Audit Log Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Log ID</label>
                  <p className="text-gray-900">#{selectedLog.audit_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="text-gray-900">{selectedLog.emp_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action</label>
                  <p className="text-gray-900">{selectedLog.action_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Table</label>
                  <p className="text-gray-900">{selectedLog.table_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Record ID</label>
                  <p className="text-gray-900">{selectedLog.record_id || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                  <p className="text-gray-900">{formatDate(selectedLog.date)}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="text-gray-900">{generateStatus(selectedLog)}</p>
              </div>

              {selectedLog.old_values && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Old Values</label>
                  <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedLog.old_values), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Values</label>
                  <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedLog.new_values), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;

// Remove this entire function block as it's now moved inside the component
const handleCleanup = async () => {
  if (!confirm(`Are you sure you want to delete audit logs older than ${retentionDays} days? This action cannot be undone.`)) {
    return;
  }

  try {
    setCleanupLoading(true);
    setError(null);
    setCleanupResult(null);

    const result = await auditAPI.cleanup({ retention_days: retentionDays });
    setCleanupResult(result);
    
    // Refresh audit data after cleanup
    await fetchAuditData();
    
  } catch (err: any) {
    console.error('Error during cleanup:', err);
    setError(err.message || 'Failed to cleanup audit logs');
  } finally {
    setCleanupLoading(false);
  }
};