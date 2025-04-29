const KpiCard = ({ title, value, subtext, icon: Icon }) => {
  return (
    <div className="flex items-center p-6 bg-white rounded-lg shadow-md">
      <div className="bg-orange-100 p-4 rounded-full mr-4">
        <Icon size={24} className="text-orange-600" />
      </div>
      <div>
        <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{subtext}</p>
      </div>
    </div>
  );
};

export default KpiCard; // <-- esto es OBLIGATORIO si haces `import KpiCard from ...`
