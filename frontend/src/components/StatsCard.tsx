import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'gold' | 'notary' | 'neutral';
}

const colorClasses = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', iconBg: 'bg-green-100', iconText: 'text-green-600' },
  gold: { bg: 'bg-gold-50', text: 'text-gold-700', border: 'border-gold-200', iconBg: 'bg-gold-100', iconText: 'text-gold-600' },
  notary: { bg: 'bg-notary-50', text: 'text-notary-700', border: 'border-notary-200', iconBg: 'bg-notary-100', iconText: 'text-notary-600' },
  neutral: { bg: 'bg-neutral-50', text: 'text-neutral-700', border: 'border-neutral-200', iconBg: 'bg-neutral-100', iconText: 'text-neutral-600' },
};

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  const classes = colorClasses[color];

  return (
    <div className={`${classes.bg} ${classes.border} border rounded-2xl p-4 sm:p-5 transition-all hover:shadow-card`}>
      <div className="flex items-center gap-3">
        <div className={`${classes.iconBg} ${classes.iconText} p-2.5 rounded-xl`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
            {title}
          </p>
          <p className={`${classes.text} text-xl sm:text-2xl font-bold`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};
