import Card from "../atoms/Gerente/Card";

export function KpiCard({ title, value, change, unit }) {
    return (
      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="text-gray-500 text-sm">{title}</h3>
        <div className="text-2xl font-bold">{value}</div>
        <div className={`text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </div>
      </div>
    );
  }
  

export default KpiCard;
