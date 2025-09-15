import React, { useState, useEffect } from "react";
import {
  FiBarChart2,
  FiTrendingUp,
  FiTrendingDown,
  FiDroplet,
  FiTruck,
  FiClock,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiLayers, // 🆕 Para mostrar consolidación
} from "react-icons/fi";
import { GiGasPump } from "react-icons/gi";
import axios from "../../lib/axios";
// 🎨 IMPORTAR SISTEMA EXISTENTE DE COLORES
import { getFaenaColors } from "../../context/faenaColor";

const ResumenStockDetallado = ({
  fechaDesde,
  fechaHasta,
  idFaena,
  mostrarDetalle,
  onToggleDetalle,
}) => {
  const [datosStock, setDatosStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarMovimientos, setMostrarMovimientos] = useState(false);
  // 🆕 Estado para mostrar desglose por faenas cuando idFaena === 'todas'
  const [mostrarDesgloseFaenas, setMostrarDesgloseFaenas] = useState(false);
  const [mostrarInfo, setMostrarInfo] = useState(false);

  // 🔍 Función para extraer nombre de faena de la descripción
  const extractFaenaFromDescription = (descripcion) => {
    if (!descripcion || typeof descripcion !== "string") {
      return null;
    }

    // Buscar patrón "Faena: [Nombre]"
    const faenaMatch = descripcion.match(/Faena:\s*([^,\-\n]+)/i);
    if (faenaMatch && faenaMatch[1]) {
      return faenaMatch[1].trim();
    }

    return null;
  };

  // Cargar datos cuando cambien los filtros
  useEffect(() => {
    if (fechaDesde && fechaHasta && idFaena && mostrarDetalle) {
      cargarDatosStock();
    }
  }, [fechaDesde, fechaHasta, idFaena, mostrarDetalle]);

  const cargarDatosStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        id_faena: idFaena, // 🆕 Puede ser 'todas' o una faena específica
      };

      console.log("📊 Cargando datos de stock detallado:", params);

      const response = await axios.get(
        "/api/verificacion-ingresos/resumen-detallado",
        { params }
      );

      if (response.data.success) {
        setDatosStock(response.data.data);
        console.log("✅ Datos de stock cargados:", response.data.data);
      } else {
        throw new Error(response.data.message || "Error al cargar datos");
      }
    } catch (err) {
      console.error("❌ Error cargando datos de stock:", err);
      setError(
        err.response?.data?.message || err.message || "Error desconocido"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return "0";
    return parseFloat(num).toLocaleString("es-CL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // 👈 fuerza formato 24 horas
      });
    } catch {
      return dateString;
    }
  };

  // 🆕 Determinar si estamos en modo "todas las faenas"
  const esModoBusquedaGlobal = idFaena === "todas";
  const datosCalculados = datosStock?.calculo_stock_detallado;
  const consolidacionFaenas = datosCalculados?.consolidacion_todas_faenas;
  // Filtrar faenas activas (al menos un valor distinto de 0)
  const faenasActivas =
    consolidacionFaenas?.resumen_por_faena?.filter(
      (faena) =>
        faena.stock_inicial !== 0 ||
        faena.stock_final !== 0 ||
        faena.total_recepciones !== 0 ||
        faena.total_consumos !== 0
    ) || [];

  if (!mostrarDetalle) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">
            {esModoBusquedaGlobal
              ? "Procesando todas las faenas..."
              : "Cargando análisis de stock..."}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
        <div className="flex items-center text-red-600">
          <FiAlertCircle className="mr-2" />
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!datosCalculados) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-center py-4 text-gray-500">
          No hay datos disponibles para el período seleccionado
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiBarChart2 className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {esModoBusquedaGlobal
                  ? "📊 Análisis Consolidado - Todas las Faenas"
                  : "📊 Análisis Detallado de Stock"}
              </h3>
              <p className="text-sm text-gray-500">
                Período: {formatDate(datosCalculados.fecha_inicio_periodo)} -{" "}
                {formatDate(datosCalculados.fecha_objetivo)}
              </p>
              {esModoBusquedaGlobal && consolidacionFaenas && (
                <p className="text-xs text-blue-600 font-medium">
                  {consolidacionFaenas.total_faenas_procesadas} faenas
                  procesadas
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onToggleDetalle}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiChevronUp size={20} />
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Stock Inicial */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Stock Inicial
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatNumber(datosCalculados.stock_inicial_periodo)}
                </p>
                <p className="text-xs text-blue-600">Litros</p>
              </div>
              <FiDroplet className="text-blue-500" size={24} />
            </div>
          </div>

          {/* Stock Final */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">
                  Stock Final
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {formatNumber(datosCalculados.stock_final_calculado)}
                </p>
                <p className="text-xs text-green-600">Litros</p>
              </div>
              <GiGasPump className="text-green-500" size={24} />
            </div>
          </div>

          {/* Total Recepciones */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">
                  Recepciones
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatNumber(datosCalculados.totales.total_recepciones)}
                </p>
                <p className="text-xs text-orange-600">Litros</p>

                {/* 🆕 Mostrar errores iniciales ajustados debajo */}
                {datosCalculados.totales.total_errores_iniciales !== null &&
                  datosCalculados.totales.total_errores_iniciales !==
                    undefined && (
                    <p className="text-xs text-red-500 font-medium">
                      Errores iniciales:{" "}
                      {formatNumber(
                        datosCalculados.totales.total_errores_iniciales
                      )}{" "}
                      L
                    </p>
                  )}
              </div>
              <FiTrendingUp className="text-orange-500" size={24} />
            </div>
          </div>

          {/* Total Consumos */}
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Consumos</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatNumber(datosCalculados.totales.total_consumos)}
                </p>
                <p className="text-xs text-red-600">Litros</p>
              </div>
              <FiTrendingDown className="text-red-500" size={24} />
            </div>
          </div>
        </div>

        {/* Diferencia neta */}
        <div className="mb-6"></div>

        {/* 🆕 DESGLOSE POR FAENAS (solo cuando idFaena === 'todas') */}
        {esModoBusquedaGlobal && consolidacionFaenas && (
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg border border-gray-200">
              <div
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => setMostrarDesgloseFaenas(!mostrarDesgloseFaenas)}
              >
                <div className="flex items-center space-x-2">
                  <FiLayers className="text-gray-600" />
                  <h4 className="font-medium text-gray-900">
                    Desglose por Faenas ({faenasActivas.length}/
                    {consolidacionFaenas.total_faenas_procesadas})
                  </h4>
                </div>
                {mostrarDesgloseFaenas ? (
                  <FiChevronUp className="text-gray-500" />
                ) : (
                  <FiChevronDown className="text-gray-500" />
                )}
              </div>

              {mostrarDesgloseFaenas && (
                <div className="border-t border-gray-200 p-4">
                  <div className="space-y-4">
                    {consolidacionFaenas.resumen_por_faena
                      .filter(
                        (faena) =>
                          faena.stock_inicial !== 0 ||
                          faena.stock_final !== 0 ||
                          faena.total_recepciones !== 0 ||
                          faena.total_consumos !== 0 ||
                          faena.diferencia_neta !== 0
                      )
                      .map((faena, index) => {
                        // 🎨 Obtener colores específicos de la faena
                        const faenaColors = getFaenaColors(faena.nombre_faena);

                        return (
                          <div
                            key={faena.id_faena}
                            className={`${faenaColors.bg} rounded-lg p-4 border ${faenaColors.borderFull}`}
                          >
                            {/* Header de la faena */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl">
                                  {faenaColors.emoji}
                                </span>
                                <div>
                                  <h5
                                    className={`font-bold text-lg ${faenaColors.text}`}
                                  >
                                    {faena.nombre_faena}
                                  </h5>
                               
                                </div>
                              </div>
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${faenaColors.badge}`}
                              >
                               
                              </span>
                            </div>

                            {/* Grid de métricas estilo tarjetas principales */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                              {/* Stock Inicial */}
                              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-medium text-blue-600">
                                      Stock Inicial
                                    </p>
                                    <p className="text-lg font-bold text-blue-900">
                                      {formatNumber(faena.stock_inicial)}
                                    </p>
                                    <p className="text-xs text-blue-600">
                                      Litros
                                    </p>
                                  </div>
                                  <FiDroplet
                                    className="text-blue-500"
                                    size={20}
                                  />
                                </div>
                              </div>

                              {/* Stock Final */}
                              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-medium text-green-600">
                                      Stock Final
                                    </p>
                                    <p className="text-lg font-bold text-green-900">
                                      {formatNumber(faena.stock_final)}
                                    </p>
                                    <p className="text-xs text-green-600">
                                      Litros
                                    </p>
                                  </div>
                                  <GiGasPump
                                    className="text-green-500"
                                    size={20}
                                  />
                                </div>
                              </div>

                              {/* Recepciones */}
                              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-medium text-orange-600">
                                      Recepciones
                                    </p>
                                    <p className="text-lg font-bold text-orange-900">
                                      {formatNumber(faena.total_recepciones)}
                                    </p>
                                    <p className="text-xs text-orange-600">
                                      Litros
                                    </p>
                                  </div>
                                  <FiTrendingUp
                                    className="text-orange-500"
                                    size={20}
                                  />
                                </div>
                              </div>

                              {/* Consumos */}
                              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-medium text-red-600">
                                      Consumos
                                    </p>
                                    <p className="text-lg font-bold text-red-900">
                                      {formatNumber(faena.total_consumos)}
                                    </p>
                                    <p className="text-xs text-red-600">
                                      Litros
                                    </p>
                                  </div>
                                  <FiTrendingDown
                                    className="text-red-500"
                                    size={20}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

{/* Movimientos cronológicos */}
<div className="mb-8">
  <div className="bg-gray-50 rounded-lg border border-gray-200">
    <div
      className="p-4 cursor-pointer flex items-center justify-between"
      onClick={() => setMostrarMovimientos(!mostrarMovimientos)}
    >
      <div className="flex items-center space-x-2">
        <FiClock className="text-gray-600" />
        <h4 className="font-medium text-gray-900">
          Movimientos Cronológicos (
          {datosCalculados.resumen_movimientos?.length || 0})
        </h4>
      </div>
      {mostrarMovimientos ? (
        <FiChevronUp className="text-gray-500" />
      ) : (
        <FiChevronDown className="text-gray-500" />
      )}
    </div>

    {mostrarMovimientos && datosCalculados.resumen_movimientos && (
      <div className="border-t border-gray-200 p-2">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {datosCalculados.resumen_movimientos.map(
            (movimiento, index) => {
              // 🔧 MAPEO CORRECTO de campos del backend
              const esRecepcion =
                movimiento.tipo?.toLowerCase() === "recepcion" ||
                movimiento.tipo?.toLowerCase() === "recepción";
              const litros = parseFloat(
                movimiento.litros_consumidos ||
                  movimiento.litros_recibidos ||
                  movimiento.litros ||
                  0
              );
              const stockResultante = parseFloat(
                movimiento.stock_posterior ||
                  movimiento.stock_resultante ||
                  0
              );
              const fechaMovimiento =
                movimiento.fecha_hora || movimiento.fecha;

              // 🎨 NUEVO: Extraer faena y obtener colores usando tu sistema existente
              const nombreFaena = extractFaenaFromDescription(
                movimiento.descripcion
              );
              const faenaColors = getFaenaColors(nombreFaena);

              return (
                <div
                  key={index}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg border-l-4 transition-all duration-200 ${faenaColors.bg} ${faenaColors.border} hover:${faenaColors.gradientLight}`}
                >
                  {/* Icono y contenido principal */}
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Icono a la izquierda */}
                    <div className="flex-shrink-0">
                      {esRecepcion ? (
                        <FiTruck className="text-green-800 text-xl" />
                      ) : (
                        <GiGasPump className="text-red-600 text-xl" />
                      )}
                    </div>

                    {/* Contenido principal */}
                    <div className="flex-1 min-w-0">
                      {/* Primera línea: Tipo y Badge */}
                      <div className="flex items-center space-x-2 mb-0.5">
                        <span className="text-sm font-medium text-gray-900 flex-shrink-0">
                          {esRecepcion ? "Recepción" : "Consumo"}
                        </span>
                        {/* 🆕 Badge de faena y emoji */}
                        {nombreFaena && (
                          <>
                            <span className="text-sm flex-shrink-0" title={`Faena: ${nombreFaena}`}>
                              {faenaColors.emoji}
                            </span>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${faenaColors.badge} flex-shrink-0`}
                            >
                              <span className="hidden sm:inline">{nombreFaena}</span>
                              <span className="sm:hidden">{nombreFaena.substring(0, 3)}</span>
                            </span>
                          </>
                        )}
                      </div>

                      {/* Segunda línea: Fecha */}
                      <p className="text-xs text-gray-500 mb-1">
                        {formatDate(fechaMovimiento)}
                      </p>

                      {/* Tercera línea: Descripción si existe */}
                      {movimiento.descripcion && (
                        <p className="text-xs text-gray-400 break-words leading-tight line-clamp-2">
                          {movimiento.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Cantidades a la derecha */}
                  <div className="text-right flex-shrink-0 ml-2">
                    <p
                      className={`text-sm font-semibold ${
                        esRecepcion ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {esRecepcion ? "+" : "-"}
                      {formatNumber(litros)} L
                    </p>
                    <p className="text-xs text-gray-500">
                      Stock: {formatNumber(stockResultante)} L
                    </p>
                    {movimiento.diferencia && (
                      <p className="text-xs text-gray-400">
                        Δ: {movimiento.diferencia > 0 ? "+" : ""}
                        {formatNumber(movimiento.diferencia)}
                      </p>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Mensaje si no hay movimientos */}
        {datosCalculados.resumen_movimientos.length === 0 && (
          <div className="text-center py-6">
            <FiClock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">No hay movimientos registrados</p>
          </div>
        )}
      </div>
    )}
  </div>
</div>



        {/* Info adicional con cálculos detallados */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 mb-4">
          {/* Header clickable */}
          <div
            className="p-3 flex items-center justify-between cursor-pointer"
            onClick={() => setMostrarInfo(!mostrarInfo)}
          >
            <div className="flex items-center space-x-2">
              <FiInfo className="text-blue-500" />
              <p className="font-medium text-blue-700">
                Información del cálculo
              </p>
            </div>
            {mostrarInfo ? (
              <FiChevronUp className="text-blue-500" />
            ) : (
              <FiChevronDown className="text-blue-500" />
            )}
          </div>

          {/* Contenido expandible */}
          {mostrarInfo && (
            <div className="p-4 text-sm text-blue-700 space-y-3">
              {/* Fórmula con números reales */}
              <div className="bg-white/70 rounded-lg p-3 border border-blue-200/50">
                <p className="font-semibold text-blue-800 mb-2">
                  📊 Cálculo del Stock Final:
                </p>
                <div className="font-mono text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600">Stock Final =</span>
                    <span className="font-bold text-green-700">
                      {formatNumber(datosCalculados.stock_final_calculado)} L
                    </span>
                  </div>
                  <div className="border-t border-blue-200/50 pt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>+ Stock Inicial</span>
                      <span className="font-semibold">
                        {formatNumber(datosCalculados.stock_inicial_periodo)} L
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-600">+ Recepciones:</span>
                      <span className="font-semibold text-green-700">
                        +
                        {formatNumber(
                          datosCalculados.totales.total_recepciones
                        )}{" "}
                        L
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-600">
                        + Errores iniciales:
                      </span>
                      <span className="font-semibold text-green-700">
                        +
                        {formatNumber(
                          datosCalculados.totales.total_errores_iniciales
                        )}{" "}
                        L
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-red-600">- Consumos:</span>
                      <span className="font-semibold text-red-700">
                        -{formatNumber(datosCalculados.totales.total_consumos)}{" "}
                        L
                      </span>
                    </div>
                    <div className="border-t border-blue-200/50 pt-1 flex items-center justify-between font-mono text-xs">
                      <span className="font-bold">Resultado:</span>
                      <span className="font-bold text-blue-800">
                        {formatNumber(datosCalculados.stock_inicial_periodo)} +{" "}
                        {formatNumber(
                          datosCalculados.totales.total_recepciones
                        )}{" "} +  {formatNumber(
                          datosCalculados.totales.total_errores_iniciales
                        )} {" "}
                        - {formatNumber(datosCalculados.totales.total_consumos)}{" "}
                        = {formatNumber(datosCalculados.stock_final_calculado)}{" "}
                        L
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <ul className="space-y-1 text-xs">
                <li>
                  • Stock inicial calculado al inicio del período seleccionado
                </li>
                <li>• Recepciones y consumos procesados cronológicamente</li>
                
                {esModoBusquedaGlobal && (
                  <li>
                    • <strong>Consolidación:</strong> Suma de todas las faenas
                    usando la misma lógica individual
                  </li>
                )}
              
              
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumenStockDetallado;
