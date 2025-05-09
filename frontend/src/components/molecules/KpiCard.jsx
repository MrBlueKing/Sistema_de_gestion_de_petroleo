import React from "react";

const KpiCard = ({ 
  title, 
  value, 
  change,
  unit = "",
  subtext,
  icon: Icon, 
  isPositive = true,
  color = "blue",
  className = ""
}) => {
  // Objeto de colores para personalizar las tarjetas
  const colors = {
    blue: "border-blue-500",
    amber: "border-amber-500",
    green: "border-green-500",
    indigo: "border-indigo-500",
    red: "border-red-500",
    teal: "border-teal-500",
    purple: "border-purple-500",
    orange: "border-orange-500"
  };
  
  const iconColors = {
    blue: "text-blue-600 bg-blue-100",
    amber: "text-amber-600 bg-amber-100",
    green: "text-green-600 bg-green-100",
    indigo: "text-indigo-600 bg-indigo-100",
    red: "text-red-600 bg-red-100",
    teal: "text-teal-600 bg-teal-100",
    purple: "text-purple-600 bg-purple-100",
    orange: "text-orange-600 bg-orange-100"
  };  
  const borderColor = colors[color] || colors.blue;
  const iconColor = iconColors[color] || iconColors.blue;
  

  
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${borderColor} hover:shadow-lg transition-shadow ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-gray-700 font-medium text-sm">{title}</h3>
        {Icon && (
          <div className={`p-2 rounded-full ${iconColor.split(" ")[1]}`}>
            <Icon size={18} className={iconColor.split(" ")[0]} />
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline">
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
        </div>
        {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
      </div>
    </div>
  );
};

export default KpiCard;