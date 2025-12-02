
import React from 'react';

export interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  innerRadius?: number; // Se > 0, vira um Donut Chart
}

const PieChart: React.FC<PieChartProps> = ({ data, size = 200, innerRadius = 0 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
      return (
          <div style={{ width: size, height: size }} className="rounded-full border-2 border-gray-600 flex items-center justify-center text-gray-500 text-xs">
              Sem dados
          </div>
      );
  }

  let cumulativePercent = 0;

  const getCoordinates = (percent: number, radius: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    // Ajuste para SVG (-1 a 1)
    return [x * radius, y * radius];
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }}>
        {data.map((slice, index) => {
          const slicePercent = slice.value / total;
          const startPercent = cumulativePercent;
          cumulativePercent += slicePercent;
          
          // Se for 100%, desenha círculo completo
          if (slicePercent > 0.999) {
             return (
                 <React.Fragment key={index}>
                    <circle cx="0" cy="0" r="1" fill={slice.color} />
                    {innerRadius > 0 && <circle cx="0" cy="0" r={innerRadius} fill="#374151" />}
                 </React.Fragment>
             )
          }

          const [startX, startY] = getCoordinates(startPercent, 1);
          const [endX, endY] = getCoordinates(cumulativePercent, 1);
          
          const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

          // Caminho para Pizza ou Donut
          let pathData = '';
          
          if (innerRadius > 0) {
             // Donut
             const [innerStartX, innerStartY] = getCoordinates(startPercent, innerRadius);
             const [innerEndX, innerEndY] = getCoordinates(cumulativePercent, innerRadius);
             
             pathData = [
                `M ${startX} ${startY}`,
                `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                `L ${innerEndX} ${innerEndY}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`,
                `Z`
             ].join(' ');
          } else {
             // Pizza
             pathData = [
                `M 0 0`,
                `L ${startX} ${startY}`,
                `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                `Z`,
              ].join(' ');
          }

          return (
            <path 
                key={index} 
                d={pathData} 
                fill={slice.color} 
                stroke="#1f2937" 
                strokeWidth="0.02"
            >
                <title>{slice.label}: {((slice.value / total) * 100).toFixed(1)}%</title>
            </path>
          );
        })}
      </svg>
    </div>
  );
};

export default PieChart;
