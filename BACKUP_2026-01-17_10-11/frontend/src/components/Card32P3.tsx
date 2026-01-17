import React from 'react';

const Card32P3 = ({ calculated32P1Stats, window32P1 }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-2 lg:p-3 h-full">
      <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-1 lg:mb-2">32P3</h3>
      <select
        className="text-xs bg-gray-200 text-gray-700 rounded px-1 py-0.5"
        value={window32P1}
        onChange={() => {}}
        title="Selecione a janela de números para 32P3"
      >
        <option value={0}>Todos</option>
        <option value={10}>Últimos 10</option>
        <option value={20}>Últimos 20</option>
        <option value={30}>Últimos 30</option>
        <option value={40}>Últimos 40</option>
        <option value={50}>Últimos 50</option>
      </select>
      <div className="space-y-0.5 lg:space-y-1">
        {[{
          label: 'WIN TOTAL',
          value: calculated32P1Stats.winTotal,
          percentage: calculated32P1Stats.total > 0 ? Math.round((calculated32P1Stats.winTotal / calculated32P1Stats.total) * 100) : 0
        }, {
          label: 'WIN',
          value: calculated32P1Stats.wins,
          percentage: calculated32P1Stats.total > 0 ? Math.round((calculated32P1Stats.wins / calculated32P1Stats.total) * 100) : 0
        }, {
          label: 'LOSS',
          value: calculated32P1Stats.losses,
          percentage: calculated32P1Stats.total > 0 ? Math.round((calculated32P1Stats.losses / calculated32P1Stats.total) * 100) : 0
        }].map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-0.5 lg:gap-1">
              <span className="text-xs lg:text-xs text-gray-600 truncate">{item.label}</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-800 text-xs lg:text-sm">{item.value}</div>
              <div className="text-xs lg:text-xs text-gray-500">{item.percentage}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Card32P3;
