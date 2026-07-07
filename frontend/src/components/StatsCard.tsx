import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const colorClasses = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
};

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors.bg} ${colors.text}`}>
          {icon}
        </div>
        <span className="text-4xl font-extrabold text-gray-900">{value}</span>
      </div>
      <p className="text-base font-semibold text-gray-700">{title}</p>
    </div>
  );
};
