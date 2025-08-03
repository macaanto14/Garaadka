import React, { useState } from 'react';
import { DollarSign, History, TrendingUp } from 'lucide-react';
import CloseCash from './CloseCash';
import CloseCashHistory from './CloseCashHistory';

const CashManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'close' | 'history'>('close');

  const tabs = [
    {
      id: 'close' as const,
      name: 'Close Cash',
      icon: DollarSign,
      description: 'End of day cash reconciliation'
    },
    {
      id: 'history' as const,
      name: 'History',
      icon: History,
      description: 'View past cash close records'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon
                  className={`-ml-0.5 mr-2 h-5 w-5 ${
                    activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'close' && <CloseCash />}
        {activeTab === 'history' && <CloseCashHistory />}
      </div>
    </div>
  );
};

export default CashManagement;