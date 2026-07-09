import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'notary' | 'gold';
}

const colorClasses = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  notary: { bg: 'bg-notary-50', text: 'text-notary-700', border: 'border-notary-200' },
  gold: { bg: 'bg-gold-50', text: 'text-gold-700', border: 'border-gold-200' },
};

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  const colors = colorClasses[color];

  return (
    <div className="app-card px-5 py-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-center justify-between gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${colors.bg} ${colors.text} ${colors.border}`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-extrabold text-neutral-900">{value}</p>
          <p className="mt-1 text-sm font-semibold text-neutral-600">{title}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
