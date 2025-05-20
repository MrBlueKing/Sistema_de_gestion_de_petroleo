import React, { useEffect } from "react";
import { FiCalendar } from "react-icons/fi";

const FiltrosComponent = ({
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  faenaSeleccionada,
  setFaenaSeleccionada,
  faenas = [] // Añadimos un valor por defecto
}) => {
  // Establecer valores iniciales solo si no hay valores previos
  useEffect(() => {
    if (!fechaDesde && !fechaHasta) {
      const hoy = new Date();
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      setFechaDesde(primerDiaMes.toISOString().slice(0, 10));  // 'YYYY-MM-DD'
      setFechaHasta(hoy.toISOString().slice(0, 10));            // 'YYYY-MM-DD'
    }
  }, [fechaDesde, fechaHasta, setFechaDesde, setFechaHasta]);

  // Obtener el nombre de la faena según su ID
  const getNombreFaena = (id) => {
    const faenaEncontrada = faenas.find(f => f.value === id);
    return faenaEncontrada ? faenaEncontrada.label : id;
  };

  return (
    <>
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 text-sm text-gray-500">
        <div className="flex items-center mb-3 md:mb-0">
          <FiCalendar className="mr-2 text-blue-500" />
          Mostrando datos para:{" "}
          <span className="font-medium text-gray-700 ml-1">
            {fechaDesde} hasta {fechaHasta}
          </span>
          {faenaSeleccionada !== "todas" && (
            <span className="ml-2">
              | Faena:{" "}
              <span className="font-medium text-gray-700 ml-1">
                {getNombreFaena(faenaSeleccionada)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Contenedor de filtros */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Faena */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Faena:
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={faenaSeleccionada}
              onChange={(e) => setFaenaSeleccionada(e.target.value)}
            >
              <option value="todas">Todas las faenas</option>
              {faenas.map(faena => (
                <option key={faena.value} value={faena.value}>
                  {faena.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desde:
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => {
                const nuevaFechaDesde = e.target.value;
                setFechaDesde(nuevaFechaDesde);
                // Ajustar fechaHasta si quedó menor que la nueva fechaDesde
                if (fechaHasta < nuevaFechaDesde) {
                  setFechaHasta(nuevaFechaDesde);
                }
              }}
              max={fechaHasta}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hasta:
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => {
                const nuevaFechaHasta = e.target.value;
                if (nuevaFechaHasta >= fechaDesde) {
                  setFechaHasta(nuevaFechaHasta);
                } else {
                  alert("La fecha 'Hasta' no puede ser menor que 'Desde'");
                }
              }}
              min={fechaDesde}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default FiltrosComponent;