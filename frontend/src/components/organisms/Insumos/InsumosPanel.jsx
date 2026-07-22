import React, { useState } from "react";
import RegistrosInsumoPanel from "./RegistrosInsumoPanel";
import CatalogoInsumosPanel from "./CatalogoInsumosPanel";

const InsumosPanel = () => {
  const [subTab, setSubTab] = useState("registros");

  return (
    <div>
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex gap-2 pt-4 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setSubTab("registros")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              subTab === "registros" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Registros
          </button>
          <button
            type="button"
            onClick={() => setSubTab("catalogo")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              subTab === "catalogo" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Catálogo
          </button>
        </div>
      </div>

      {subTab === "registros" ? <RegistrosInsumoPanel /> : <CatalogoInsumosPanel />}
    </div>
  );
};

export default InsumosPanel;
