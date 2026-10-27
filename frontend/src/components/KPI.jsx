import { Icon } from './Icon.jsx';

const KPI = ({ title, value, sub, icon, color = 'blue', trend, trendLabel }) => {
  const C = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}
            >
              <span>{trend >= 0 ? '▲' : '▼'}</span>
              {Math.abs(trend)}% {trendLabel}
            </div>
          )}
        </div>
        <div className={`${C[color]} p-3 rounded-xl shrink-0`}>
          <Icon name={icon} className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export { KPI };
