// src/components/molecules/TabProgressBar.jsx
import React from "react";

const TabProgressBar = ({ activeTab = "solicitante" }) => {
  const tabs = [
    { id: "solicitante", label: "Solicitante" },
    { id: "maquinaria", label: "Maquinaria/Vehículo" },
    { id: "patente", label: "N°/Patente" },
    { id: "consumo", label: "Consumo" },
    { id: "confirmarDatos", label: "Confirmar Datos" }
  ];

  return (
    <div className="w-full bg-white rounded-lg overflow-hidden flex">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === tab.id
              ? "bg-orange-800 text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabProgressBar;


