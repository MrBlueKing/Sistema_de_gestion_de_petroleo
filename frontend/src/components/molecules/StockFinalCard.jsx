import React from "react";
import { GiGasPump } from "react-icons/gi";

const StockFinalCard = ({
  datosCalculados,
  loading = false,
  className = "",
}) => {
  // ✅ DEBUGGING: Ver qué datos recibimos
  console.log(
    "🔍 StockFinalCard - datosCalculados recibidos:",
    datosCalculados
  );
  console.log(
    "🔍 StockFinalCard - Propiedades disponibles:",
    datosCalculados ? Object.keys(datosCalculados) : "No hay datos"
  );

  // Función para formatear números (igual que ResumenStockDetallado)
  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "0";
    return new Intl.NumberFormat("es-CL").format(Math.round(value));
  };

  // Si está cargando
  if (loading) {
    return (
      <div
        className={`bg-green-50 rounded-lg p-4 border border-green-200 animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-green-200 rounded mb-2"></div>
            <div className="h-8 bg-green-200 rounded mb-1"></div>
            <div className="h-3 bg-green-200 rounded w-12"></div>
          </div>
          <div className="w-6 h-6 bg-green-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Si no hay datos calculados
  if (!datosCalculados) {
    return (
      <div
        className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Stock Final</p>
            <p className="text-2xl font-bold text-gray-400">--</p>
            <p className="text-xs text-gray-500">Sin datos</p>
          </div>
          <GiGasPump className="text-gray-400" size={24} />
        </div>
      </div>
    );
  }

  // ✅ BUSCAR EL STOCK FINAL EN MÚLTIPLES POSIBLES ESTRUCTURAS
  let stockFinal = null;

  // Estructura del endpoint /api/verificacion-ingresos/resumen-detallado
  if (datosCalculados.stock_final_calculado !== undefined) {
    stockFinal = datosCalculados.stock_final_calculado;
    console.log("✅ Usando stock_final_calculado:", stockFinal);
  }
  // Estructura alternativa
  else if (datosCalculados.stock_final !== undefined) {
    stockFinal = datosCalculados.stock_final;
    console.log("✅ Usando stock_final:", stockFinal);
  }
  // Para modo "todas las faenas" - puede ser consolidación
  else if (
    datosCalculados.consolidacion_todas_faenas?.stock_final_total !== undefined
  ) {
    stockFinal = datosCalculados.consolidacion_todas_faenas.stock_final_total;
    console.log("✅ Usando stock_final_total de consolidación:", stockFinal);
  }

  // ✅ MOSTRAR ERROR SI NO ENCONTRAMOS LA ESTRUCTURA
  if (stockFinal === null || stockFinal === undefined) {
    console.error(
      "❌ No se encontró campo de stock final en:",
      datosCalculados
    );
    return (
      <div
        className={`bg-yellow-50 rounded-lg p-4 border border-yellow-200 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-600">Stock Final</p>
            <p className="text-2xl font-bold text-yellow-400">??</p>
            <p className="text-xs text-yellow-500">
              Estructura de datos no reconocida
            </p>
          </div>
          <GiGasPump className="text-yellow-400" size={24} />
        </div>
        <div className="mt-2 pt-2 border-t border-yellow-200">
          <p className="text-xs text-yellow-600">
            DEBUG: Propiedades disponibles:{" "}
            {Object.keys(datosCalculados).join(", ")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-green-50 rounded-lg p-4 border border-green-200 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-green-600">Stock Final</p>
          <p className="text-2xl font-bold text-green-900">
            {formatNumber(stockFinal)} Litros
          </p>
          
        </div>
        <GiGasPump className="text-green-500" size={24} />
      </div>
  
    </div>
  );
};

export default StockFinalCard;
