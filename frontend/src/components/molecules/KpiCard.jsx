import React from "react";

const KpiCard = ({ title, value, subtext, icon: Icon, color = "orange" }) => {
  // Objeto de colores para personalizar las tarjetas
  const colors = {
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    indigo: "bg-indigo-100 text-indigo-600",
    red: "bg-red-100 text-red-600",
    teal: "bg-teal-100 text-teal-600",
    purple: "bg-purple-100 text-purple-600",
  };
  
  const iconColor = colors[color] || colors.orange;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
      <div className={`p-4 rounded-full mr-4 ${iconColor.split(" ")[0]}`}>
        <Icon size={24} className={iconColor.split(" ")[1]} />
      </div>
      <div>
        <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{subtext}</p>
      </div>
    </div>
  );
};

export default KpiCard;