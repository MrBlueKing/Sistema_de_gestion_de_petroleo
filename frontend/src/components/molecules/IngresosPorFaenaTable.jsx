import React, { useState, useEffect, useMemo } from "react";
import axios from "../../lib/axios";
import {
  FiLoader,
  FiAlertCircle,
  FiInfo,
  FiTrendingUp,
  FiRefreshCw,
} from "react-icons/fi";
import { getFaenaColors } from '../../context/faenaColor';



const IngresosPorFaenaTable = ({
  fechaDesde,
  fechaHasta,
  faenaSeleccionada,
  refreshKey,
}) => {
  const [datosIngresos, setDatosIngresos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // 🚀 FUNCIÓN PRINCIPAL: Cargar datos de ingresos por faena
  const cargarDatosIngresosFaena = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Consultando ingresos con parámetros:", {
        fecha_inicio: fechaDesde,
        fecha_fin: fechaHasta,
        faena: faenaSeleccionada !== "todas" ? faenaSeleccionada : null,
      });

      // 📡 Llamada al endpoint principal
      const response = await axios.get("/api/ingresos-petroleo", {
        params: {
          fecha_inicio: fechaDesde,
          fecha_fin: fechaHasta,
          faena: faenaSeleccionada !== "todas" ? faenaSeleccionada : null,
        },
      });

      console.log("📊 Respuesta del servidor:", response.data);

      // ✅ Validar respuesta
      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Respuesta inválida del servidor"
        );
      }

      const ingresos = response.data.data || [];
      console.log(`✅ Se obtuvieron ${ingresos.length} registros de ingresos`);

      // 📈 PROCESAR DATOS POR FAENA
      const faenasMap = new Map();

      ingresos.forEach((ingreso) => {
        // Obtener nombre de faena de diferentes posibles ubicaciones
        const faenaNombre =
          ingreso.faena?.ubicacion ||
          ingreso.nombre_faena ||
          ingreso.faena?.nombre ||
          "Faena Sin Nombre";

        const faenaId = ingreso.faena?.id_faena || ingreso.id_faena || 0;

        // Inicializar faena si no existe
        if (!faenasMap.has(faenaNombre)) {
          faenasMap.set(faenaNombre, {
            id_faena: faenaId,
            nombre_faena: faenaNombre,
            litros_documentados: 0,
            litros_recibidos: 0,
            valor_total: 0,
            total_ingresos: 0,
            suma_precio_litros: 0, // Para precio ponderado
            diferencia_total: 0,
          });
        }

        const faenaData = faenasMap.get(faenaNombre);

        // 🧮 ACUMULAR DATOS
        faenaData.litros_documentados += parseFloat(
          ingreso.litros_documentados || 0
        );
        faenaData.litros_recibidos += parseFloat(ingreso.litros_recibidos || 0);
        faenaData.valor_total += parseFloat(ingreso.precio_total || 0);
        faenaData.total_ingresos += 1;
        faenaData.diferencia_total += parseFloat(ingreso.diferencia || 0);

        // Para cálculo de precio promedio ponderado
        const precio = parseFloat(ingreso.precio || 0);
        const litrosRecibidos = parseFloat(ingreso.litros_recibidos || 0);

        if (precio > 0 && litrosRecibidos > 0) {
          faenaData.suma_precio_litros += precio * litrosRecibidos;
        }
      });

      // 🎯 CONVERTIR MAP A ARRAY Y CALCULAR MÉTRICAS
      const faenasArray = Array.from(faenasMap.values()).map((faena) => {
        const precioPonderado =
          faena.litros_recibidos > 0
            ? Math.round(faena.suma_precio_litros / faena.litros_recibidos)
            : 0;

        const porcentajeDiferencia =
          faena.litros_documentados > 0
            ? (
                (faena.diferencia_total / faena.litros_documentados) *
                100
              ).toFixed(1)
            : "0.0";

        return {
          id_faena: faena.id_faena,
          nombre_faena: faena.nombre_faena,
          litros_documentados:
            Math.round(faena.litros_documentados * 100) / 100,
          litros_recibidos: Math.round(faena.litros_recibidos * 100) / 100,
          valor_total: Math.round(faena.valor_total * 100) / 100,
          total_ingresos: faena.total_ingresos,
          diferencia_total: Math.round(faena.diferencia_total * 100) / 100,
          precio_promedio: precioPonderado,
          porcentaje_diferencia: porcentajeDiferencia,
        };
      });

      // 📊 Ordenar por litros recibidos (descendente)
      faenasArray.sort((a, b) => b.litros_recibidos - a.litros_recibidos);

      console.log("📈 Datos procesados por faena:", faenasArray);

      setDatosIngresos(faenasArray);
      setUltimaActualizacion(new Date());
    } catch (err) {
      console.error("❌ Error al cargar datos de ingresos por faena:", err);

      let mensajeError = "Error desconocido";

      if (err.code === "ECONNABORTED") {
        mensajeError = "⏱️ Tiempo de espera agotado. Intente nuevamente.";
      } else if (err.response?.status === 404) {
        mensajeError = "🔍 Endpoint no encontrado. Verifique la configuración.";
      } else if (err.response?.status === 500) {
        mensajeError = "⚠️ Error interno del servidor.";
      } else {
        mensajeError = err.message || "❌ Error al cargar datos";
      }

      setError(mensajeError);
      setDatosIngresos([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 DATOS FILTRADOS (si hay faena específica seleccionada)
  const datosFiltrados = useMemo(() => {
    if (!faenaSeleccionada || faenaSeleccionada === "todas") {
      return datosIngresos;
    }

    return datosIngresos.filter(
      (faena) => faena.id_faena === parseInt(faenaSeleccionada)
    );
  }, [datosIngresos, faenaSeleccionada]);

  // 🔄 EFFECT: Cargar datos cuando cambien los filtros
  useEffect(() => {
    if (fechaDesde && fechaHasta) {
      console.log("🔄 Recargando datos por cambio en filtros...");
      cargarDatosIngresosFaena();
    }
  }, [fechaDesde, fechaHasta, faenaSeleccionada, refreshKey]);

  // 🔢 CALCULAR TOTALES
  const totales = useMemo(() => {
    return datosFiltrados.reduce(
      (acc, faena) => ({
        litros_documentados:
          acc.litros_documentados + faena.litros_documentados,
        litros_recibidos: acc.litros_recibidos + faena.litros_recibidos,
        valor: acc.valor + faena.valor_total,
        ingresos: acc.ingresos + faena.total_ingresos,
        diferencia: acc.diferencia + faena.diferencia_total,
      }),
      {
        litros_documentados: 0,
        litros_recibidos: 0,
        valor: 0,
        ingresos: 0,
        diferencia: 0,
      }
    );
  }, [datosFiltrados]);

  // 🔄 LOADING STATE
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <FiLoader
            className="animate-spin h-6 w-6 mr-2"
            style={{ color: "#F67029" }}
          />
          <span className="text-gray-600">Cargando ingresos por faena...</span>
        </div>
      </div>
    );
  }

  // ❌ ERROR STATE
  if (error) {
    return (
      <div
        className="bg-white rounded-lg shadow-md p-4 border-l-4"
        style={{ borderColor: "#AB201A" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ color: "#AB201A" }}>
            <FiAlertCircle className="h-4 w-4 mr-2" />
            <div>
              <h4 className="font-medium text-sm">Error al cargar datos</h4>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={cargarDatosIngresosFaena}
            className="flex items-center px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors"
          >
            <FiRefreshCw className="h-3 w-3 mr-1" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // 📭 EMPTY STATE
  if (!datosFiltrados || datosFiltrados.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full">
        <h3 className="text-md font-medium text-gray-800 flex items-center">
          <FiTrendingUp className="h-4 w-4 mr-2" style={{ color: "#F67029" }} />
          Ingresos por Faena
        </h3>
        <div className="text-center text-gray-500 py-8">
          <FiInfo className="h-8 w-8 mx-auto  text-gray-300" />
          <p className="text-sm">
            No hay datos disponibles para el período seleccionado
          </p>
          {fechaDesde && fechaHasta && (
            <p className="text-xs text-gray-400 mt-1">
              Período: {fechaDesde} a {fechaHasta}
            </p>
          )}
        </div>
      </div>
    );
  }

  // 🎨 RENDER PRINCIPAL
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
      {/* 📋 HEADER */}
      <div
        className="p-4 border-b"
        style={{
          background: "linear-gradient(135deg, #FFF5F2 0%, #FEF2F2 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-md font-medium text-gray-800 flex items-center">
              <FiTrendingUp
                className="h-4 w-4 mr-2"
                style={{ color: "#F67029" }}
              />
              Ingresos por Faena
            </h3>
            {ultimaActualizacion && (
              <p className="text-xs text-gray-500 mt-1">
                Última actualización:{" "}
                {ultimaActualizacion.toLocaleTimeString("es-ES")}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-600">
              {datosFiltrados.length} faena
              {datosFiltrados.length !== 1 ? "s" : ""} • {totales.ingresos}{" "}
              ingresos
            </div>
            <div className="text-xs text-gray-500">
              Total:{" "}
              {Math.round(totales.litros_recibidos).toLocaleString("es-CL")}L
            </div>
          </div>
        </div>
      </div>

      {/* 📊 TABLA */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Faena
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Litros Recibidos
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio Prom.
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Diferencia
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ingresos
              </th>
            </tr>
          </thead>
        <tbody className="bg-white divide-y divide-gray-200">
  {datosFiltrados.map((faena, index) => {
    const faenaColors = getFaenaColors(faena.nombre_faena);
    return (
      <tr
        key={`${faena.id_faena}-${index}`}
        className={`${faenaColors.bg} ${faenaColors.border} ${faenaColors.hover} transition-all duration-200 group`}
        style={{
          minHeight: `${Math.max(860, 100 / datosFiltrados.length)}px` // 👈 Altura mínima distribuida
        }}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex flex-col">
            <div className="font-medium text-gray-900 text-sm flex items-center">
              <span className="text-sm mr-2">{faenaColors.emoji}</span>
              {faena.nombre_faena}
            </div>
            <div className="text-xs text-gray-500">
              {faena.litros_documentados > 0 && (
                <span>
                  {Math.round(
                    faena.litros_documentados
                  ).toLocaleString("es-CL")}
                 
                </span>
                
              )}
            </div>
            <div className="text-xs text-gray-500">
              {faena.litros_documentados > 0 && (
                <span>
                 
                  L documentados
                </span>
                
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <div className="text-sm font-bold text-gray-900">
            {Math.round(faena.litros_recibidos).toLocaleString(
              "es-CL"
            )}
            L
          </div>
          <div className="text-xs text-gray-500">
            {totales.litros_recibidos > 0
              ? (
                  (faena.litros_recibidos /
                    totales.litros_recibidos) *
                  100
                ).toFixed(1) + "%"
              : "0%"}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <div
            className="text-sm font-bold"
            style={{ color: "#AB201A" }}
          >
            ${Math.round(faena.valor_total).toLocaleString("es-CL")}
          </div>
          <div className="text-xs text-gray-500">
            {faena.litros_recibidos > 0
              ? `$${Math.round(
                  faena.valor_total / faena.litros_recibidos
                )}/L efectivo`
              : "N/A"}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <div
            className="text-sm font-medium"
            style={{ color: "#F67029" }}
          >
            ${faena.precio_promedio.toLocaleString("es-CL")}
          </div>
          <div className="text-xs text-gray-500">ponderado</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <div
            className={`text-sm font-medium ${
              faena.diferencia_total === 0
                ? "text-gray-500"
                : faena.diferencia_total > 0
                ? "text-red-600"
                : "text-red-700"
            }`}
          >
            {faena.diferencia_total > 0 ? "+" : ""}
            {Math.round(faena.diferencia_total).toLocaleString(
              "es-CL"
            )}
            L
          </div>
          <div className="text-xs text-gray-500">
            {faena.porcentaje_diferencia !== "0.0"
              ? `${faena.porcentaje_diferencia}%`
              : "Sin diferencia"}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <div className="text-sm font-medium text-gray-900">
            {faena.total_ingresos}
          </div>
          <div className="text-xs text-gray-500">entregas</div>
        </td>
      </tr>
    );
  })}
</tbody>
          {datosFiltrados.length > 1 && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="px-6 py-3 font-bold text-gray-900">
                  TOTAL 
                </td>
                <td className="px-6 py-3 text-right font-bold text-gray-900">
                  {Math.round(totales.litros_recibidos).toLocaleString("es-CL")}
                  L
                </td>
                <td
                  className="px-6 py-3 text-right font-bold"
                  style={{ color: "#AB201A" }}
                >
                  ${Math.round(totales.valor).toLocaleString("es-CL")}
                </td>
                <td
                  className="px-6 py-3 text-right font-bold"
                  style={{ color: "#F67029" }}
                >
                  $
                  {totales.litros_recibidos > 0
                    ? Math.round(
                        totales.valor / totales.litros_recibidos
                      ).toLocaleString("es-CL")
                    : 0}
                </td>
                <td className="px-6 py-3 text-right font-bold">
                  <span
                    style={{
                      color:
                        totales.diferencia === 0
                          ? "#6B7280"
                          : totales.diferencia > 0
                          ? "#DC2626"
                          : "#B91C1C",
                    }}
                  >
                    {totales.diferencia > 0 ? "+" : ""}
                    {Math.round(totales.diferencia).toLocaleString("es-CL")}L
                  </span>
                </td>
                <td className="px-6 py-3 text-right font-bold text-gray-900">
                  {totales.ingresos}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
export default IngresosPorFaenaTable;
