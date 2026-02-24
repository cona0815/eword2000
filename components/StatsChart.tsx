import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatsChartProps {
  total: number;
  unfamiliar: number;
  mastered: number;
}

const StatsChart: React.FC<StatsChartProps> = ({ total, unfamiliar, mastered }) => {
  const data = [
    { name: '已掌握', value: mastered },
    { name: '不熟/待加強', value: unfamiliar },
    { name: '未學習', value: total - mastered - unfamiliar },
  ];

  const COLORS = ['#10b981', '#facc15', '#e2e8f0'];

  return (
    <div className="h-64 w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold text-slate-700 mb-2">學習進度概況</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;