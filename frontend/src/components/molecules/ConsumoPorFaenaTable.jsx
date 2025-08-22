import React, { useState, useEffect, useMemo } from "react";
import axios from "../../lib/axios";
import {
  FiLoader,
  FiAlertCircle,
  FiInfo,
  FiMapPin,
  FiClock,
} from "react-icons/fi";

const FAENA_COLORS_SUBTLE = {
  Cabildo: {
    id: 1,
    light: "bg-green-50/30", // Verde muy suave con transparencia
    border: "border-l-green-300/40", // Borde izquierdo sutil
    hover: "hover:bg-green-50/50", // Hover ligeramente más visible
    badge: "bg-green-100/70 text-green-700/80", // Badge con transparencia
    icon: "🌿",
  },
  Tiltil: {
    id: 4,
    light: "bg-red-50/30", // Rojo muy suave con transparencia
    border: "border-l-red-300/40", // Borde izquierdo sutil
    hover: "hover:bg-red-50/50", // Hover ligeramente más visible
    badge: "bg-red-100/70 text-red-700/80", // Badge con transparencia
    icon: "🏔️",
  },
};

// 🛠️ Función para obtener colores SUTILES de una faena
const getFaenaColorsSutil = (faenaName) => {
  if (!faenaName || typeof faenaName !== "string") {
    return {
      light: "bg-gray-50/20", // Gris muy suave
      border: "border-l-gray-300/30", // Borde gris sutil
      hover: "hover:bg-gray-50/40", // Hover sutil
      badge: "bg-gray-100/60 text-gray-700/70",
      icon: "🏢",
    };
  }

  const normalizedName = faenaName.trim();

  for (const [key, colors] of Object.entries(FAENA_COLORS_SUBTLE)) {
    if (key.toLowerCase() === normalizedName.toLowerCase()) {
      return colors;
    }
  }

  // Color por defecto MUY SUTIL para faenas desconocidas
  return {
    light: "bg-blue-50/25", // Azul muy suave para gráficos
    border: "border-l-blue-300/35", // Borde azul sutil
    hover: "hover:bg-blue-50/45", // Hover sutil
    badge: "bg-blue-100/65 text-blue-700/75",
    icon: "🏢",
  };
};

const ConsumoPorFaenaTable = ({
  fechaDesde,
  fechaHasta,
  // ✅ NUEVAS PROPS: Recibir las horas
  horaDesde,
  horaHasta,
  faenaSeleccionada,
  refreshKey,
}) => {
  const [datosConsumo, setDatosConsumo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadatos, setMetadatos] = useState(null);

  // ✅ FUNCIÓN: Formatear fecha con hora
  const formatearFechaHora = (fecha, hora) => {
    if (!fecha) return fecha;
    if (!hora) return fecha;
    return `${fecha} ${hora}:00`;
  };

  // ✅ SIMPLIFICADO: Cargar datos y agrupar solo por faena
  const cargarDatosConsumoFaena = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ CORRECCIÓN: Usar las horas en la llamada al backend
      const fechaInicioFormateada = formatearFechaHora(fechaDesde, horaDesde);
      const fechaFinFormateada = formatearFechaHora(fechaHasta, horaHasta);

      console.log("🕐 [ConsumoPorFaenaTable] Enviando fechas con hora:", {
        fecha_inicio: fechaInicioFormateada,
        fecha_fin: fechaFinFormateada,
        hora_desde: horaDesde,
        hora_hasta: horaHasta,
      });

      const diasPeriodo =
        fechaDesde && fechaHasta
          ? Math.ceil(
              (new Date(fechaHasta) - new Date(fechaDesde)) /
                (1000 * 60 * 60 * 24)
            ) + 1
          : 30;

      const response = await axios.post("/api/consumo-categorias/calcular", {
        fecha_inicio: fechaInicioFormateada,
        fecha_fin: fechaFinFormateada,
        id_faena:
          faenaSeleccionada !== "todas" ? parseInt(faenaSeleccionada) : null,
        incluir_simulacion: true,
        usar_fechas_automaticas: false,
        periodo_dias: diasPeriodo,
        incluir_sabados: true,
        incluir_domingos: false,
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Error en respuesta del servidor"
        );
      }

      const categoriasData = response.data.analisis_por_categoria || [];
      const metadatosResponse = response.data.metadatos || {};

      setMetadatos(metadatosResponse);

      // ✅ AGRUPACIÓN SIMPLIFICADA: Solo por faena, sin separar máquinas
      const consumoPorFaena = {};

      categoriasData.forEach((categoria) => {
        if (
          categoria.analisis_detallado &&
          categoria.analisis_detallado.length > 0
        ) {
          categoria.analisis_detallado.forEach((maquina) => {
            const faenaInfo = maquina.maquina?.faena;
            if (!faenaInfo || !faenaInfo.id) return;

            const faenaId = faenaInfo.id;
            const faenaNombre = faenaInfo.nombre || "Sin Faena Asignada";

            // ✅ CLAVE SIMPLE: Solo por faena (sin separación por máquina)
            const claveUnica = `${faenaId}`;

            if (!consumoPorFaena[claveUnica]) {
              consumoPorFaena[claveUnica] = {
                id_faena: faenaId,
                nombre_faena: faenaNombre,
                litros_confirmados: 0,
                litros_simulados: 0,
                litros_totales: 0,
                valor_total: 0,
                maquinas_activas: new Set(),
                categorias_activas: new Set(),
                registros_count: 0,
                consumos_count: 0,
              };
            }

            // Acumular datos de consumo
            const totalConfirmado =
              maquina.resumen_ejecutivo?.litros_confirmados || 0;
            const totalSimulado =
              maquina.resumen_ejecutivo?.litros_simulados || 0;
            const valorTotal = maquina.costos?.valor_total || 0;

            consumoPorFaena[claveUnica].litros_confirmados += totalConfirmado;
            consumoPorFaena[claveUnica].litros_simulados += totalSimulado;
            consumoPorFaena[claveUnica].litros_totales +=
              totalConfirmado + totalSimulado;
            consumoPorFaena[claveUnica].valor_total += valorTotal;

            // Tracking de máquinas y categorías únicas
            consumoPorFaena[claveUnica].maquinas_activas.add(
              maquina.maquina?.id
            );
            consumoPorFaena[claveUnica].categorias_activas.add(
              categoria.categoria?.nombre
            );

            // Contar registros
            if (maquina.periodos_confirmados) {
              consumoPorFaena[claveUnica].registros_count +=
                maquina.periodos_confirmados.length;
            }

            // Incrementar contador de operaciones
            consumoPorFaena[claveUnica].consumos_count += 1;
          });
        }
      });

      // Convertir a array y calcular estadísticas finales
      const faenasArray = Object.values(consumoPorFaena).map((faena) => ({
        ...faena,
        total_maquinas: faena.maquinas_activas.size,
        total_categorias: faena.categorias_activas.size,
        precio_promedio:
          faena.litros_totales > 0
            ? Math.round(faena.valor_total / faena.litros_totales)
            : 0,
        porcentaje_confirmado:
          faena.litros_totales > 0
            ? (faena.litros_confirmados / faena.litros_totales) * 100
            : 0,
        // Limpiar sets para evitar problemas de serialización
        maquinas_activas: undefined,
        categorias_activas: undefined,
      }));

      // ✅ ORDENAMIENTO SIMPLE: Por ID de faena
      faenasArray.sort((a, b) => a.id_faena - b.id_faena);

      setDatosConsumo(faenasArray);

      console.log("✅ [ConsumoPorFaenaTable] Datos cargados con horarios:", {
        faenas: faenasArray.length,
        periodo: `${fechaInicioFormateada} - ${fechaFinFormateada}`,
      });
    } catch (err) {
      console.error("Error al cargar datos de consumo por faena:", err);
      setError(
        "Error al cargar datos: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Filtrar datos si hay faena seleccionada
  const datosFiltrados = useMemo(() => {
    if (!faenaSeleccionada || faenaSeleccionada === "todas") {
      return datosConsumo;
    }
    return datosConsumo.filter(
      (faena) => faena.id_faena === parseInt(faenaSeleccionada)
    );
  }, [datosConsumo, faenaSeleccionada]);

  // ✅ CORRECCIÓN: Incluir las horas en las dependencias del useEffect
  useEffect(() => {
    if (fechaDesde && fechaHasta && horaDesde && horaHasta) {
      cargarDatosConsumoFaena();
    }
  }, [
    fechaDesde,
    fechaHasta,
    horaDesde,
    horaHasta,
    faenaSeleccionada,
    refreshKey,
  ]);
  // Estados de carga y error
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <FiLoader
            className="animate-spin h-6 w-6 mr-2"
            style={{ color: "#F67029" }}
          />
          <span className="text-gray-600">Cargando consumo por faena...</span>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div
        className="bg-white rounded-lg shadow-md p-4 border-l-4"
        style={{ borderColor: "#AB201A" }}
      >
        <div className="flex items-center" style={{ color: "#AB201A" }}>
          <FiAlertCircle className="h-4 w-4 mr-2" />
          <div>
            <h4 className="font-medium text-sm">Error al cargar datos</h4>
            <p className="text-xs mt-1">{error}</p>
            <button
              onClick={cargarDatosConsumoFaena}
              className="mt-2 text-xs underline hover:no-underline"
              style={{ color: "#F67029" }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!datosFiltrados || datosFiltrados.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-0">
        <h3 className="text-md font-medium text-gray-800 mb-4 flex items-center">
          <FiMapPin className="h-4 w-4 mr-2" style={{ color: "#F67029" }} />
          Consumo por Faena
        </h3>
        <div className="text-center text-gray-500 py-8">
          <FiInfo className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">
            No hay datos disponibles para el período seleccionado
          </p>
          <p className="text-xs mt-1 text-gray-400">
            Prueba expandir el rango de fechas o verificar que haya máquinas
            operativas en las faenas
          </p>
        </div>
      </div>
    );
  }
  // Calcular totales generales
  const totales = datosFiltrados.reduce(
    (acc, faena) => ({
      litros_confirmados: acc.litros_confirmados + faena.litros_confirmados,
      litros_simulados: acc.litros_simulados + faena.litros_simulados,
      litros_totales: acc.litros_totales + faena.litros_totales,
      valor: acc.valor + faena.valor_total,
      maquinas: acc.maquinas + faena.total_maquinas,
      registros: acc.registros + faena.registros_count,
    }),
    {
      litros_confirmados: 0,
      litros_simulados: 0,
      litros_totales: 0,
      valor: 0,
      maquinas: 0,
      registros: 0,
    }
  );
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header simplificado */}
      <div
        className="p-4 border-b"
        style={{
          background: "linear-gradient(135deg, #FFF5F2 0%, #FEF2F2 100%)",
        }}
      >
        <h3 className="text-md font-medium text-gray-800 flex items-center justify-between">
          <div className="flex items-center">
            <FiMapPin className="h-4 w-4 mr-2" style={{ color: "#F67029" }} />
            Consumo por Faena
          </div>
          <div className="text-xs text-gray-600">
            {datosFiltrados.length} faena
            {datosFiltrados.length !== 1 ? "s" : ""} • {totales.registros}{" "}
            registros
          </div>
        </h3>
        {/* ✅ INFORMACIÓN DEL PERÍODO CON HORAS */}
        {metadatos && (
          <div className="mt-2 text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <FiClock className="h-3 w-3 mr-1 text-blue-500" />
                {formatearFechaHora(fechaDesde, horaDesde)} -{" "}
                {formatearFechaHora(fechaHasta, horaHasta)}
              </span>
              <span>
                ⚙️ {metadatos.periodo?.dias_laborales_reales} días laborales
              </span>
              <span>🏭 Totales agrupados por ubicación</span>
            </div>
            {metadatos.filtros_aplicados?.faena &&
              metadatos.filtros_aplicados.faena !== "Todas las faenas" && (
                <div className="mt-1">
                  <span>🎯 {metadatos.filtros_aplicados.faena}</span>
                </div>
              )}
          </div>
        )}
      </div>
      {/* Tabla simplificada */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Faena
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consumo Real
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consumo Simulado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Litros
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Máquinas Activas
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {datosFiltrados.map((faena, index) => {
              const faenaColors = getFaenaColorsSutil(faena.nombre_faena);
              return (
                <tr
                  key={`faena-${faena.id_faena}-${index}`}
                  className={`${faenaColors.light} ${faenaColors.border} ${faenaColors.hover} transition-all duration-200 group`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-900 flex items-center">
                        <span className="text-sm mr-2">{faenaColors.icon}</span>
                        {faena.nombre_faena}
                      </div>
                      <div className="text-xs text-gray-500">
                        {faena.registros_count} registros
                        </div>
                       
                      <div className="text-xs" style={{ color: "#F67029" }}>
                        {faena.porcentaje_confirmado.toFixed(1)}% datos reales
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div
                      className="text-sm font-bold"
                      style={{ color: "#9A0000" }}
                    >
                      {Math.round(faena.litros_confirmados).toLocaleString(
                        "es-CL"
                      )}
                      L
                    </div>
                    <div className="text-xs text-gray-500">confirmados</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-600">
                      {Math.round(faena.litros_simulados).toLocaleString(
                        "es-CL"
                      )}
                      L
                    </div>
                    <div className="text-xs text-gray-400">proyectados</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {Math.round(faena.litros_totales).toLocaleString("es-CL")}
                      L
                    </div>
                    <div className="text-xs text-gray-500">
                      {totales.litros_totales > 0
                        ? (
                            (faena.litros_totales / totales.litros_totales) *
                            100
                          ).toFixed(1) + "%"
                        : "0%"}{" "}
                      del total
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
                      ${faena.precio_promedio.toLocaleString("es-CL")}/L
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {faena.total_maquinas}
                    </div>
                    <div className="text-xs text-gray-500">
                      máquina{faena.total_maquinas !== 1 ? "s" : ""}
                    </div>
                    <div className="text-xs text-gray-400">
                      {faena.consumos_count} operaciones
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Fila de totales */}
          {datosFiltrados.length > 1 && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="px-6 py-3 font-bold text-gray-900">
                  TOTAL
                </td>
                <td
                  className="px-6 py-3 text-right font-bold"
                  style={{ color: "#9A0000" }}
                >
                  {Math.round(totales.litros_confirmados).toLocaleString(
                    "es-CL"
                  )}
                  L
                </td>
                <td className="px-6 py-3 text-right font-bold text-gray-600">
                  {Math.round(totales.litros_simulados).toLocaleString("es-CL")}
                  L
                </td>
                <td className="px-6 py-3 text-right font-bold text-gray-900">
                  {Math.round(totales.litros_totales).toLocaleString("es-CL")}L
                </td>
                <td
                  className="px-6 py-3 text-right font-bold"
                  style={{ color: "#AB201A" }}
                >
                  ${Math.round(totales.valor).toLocaleString("es-CL")}
                </td>
                <td className="px-6 py-3 text-right font-bold text-gray-900">
                  {totales.maquinas} total
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

     
    </div>
  );
};

export default ConsumoPorFaenaTable;
