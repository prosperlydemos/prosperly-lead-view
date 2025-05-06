
import React from 'react';

// Custom chart tooltip component
export const CustomTooltip = (props: any) => {
  if (!props.active || !props.payload || !props.payload.length) {
    return null;
  }

  return (
    <div className="bg-background border p-2 rounded-md shadow-md">
      {props.payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm" 
            style={{ background: entry.color }}
          />
          <span>{entry.name || ''}: {entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// Custom chart legend component
export const CustomChartLegend = ({ 
  data, 
  colors 
}: { 
  data: Array<{ name: string; value: number }>; 
  colors: string[] 
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {data.map((item, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm" 
            style={{ backgroundColor: colors[index % colors.length] }} 
          />
          <span className="text-sm">{item.name}</span>
        </div>
      ))}
    </div>
  );
};
