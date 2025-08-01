import React, { useState, useEffect } from "react";
import axios from "../../lib/axios";
import {
  FiLoader,
  FiTrendingUp,
  FiAlertCircle,
  FiInfo,
  FiBarChart,
  FiDollarSign,
  FiClock,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";


const ConsumoPorMaquinaPureTable = ({
  fechaDesde,
  fechaHasta,
  horaDesde,
  horaHasta,
  faenaSeleccionada,
  refreshKey,
}) => {
  const [datosConsumo, setDatosConsumo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resumenGeneral, setResumenGeneral] = useState(null);

  // 🆕 ESTADOS PARA ORDENAMIENTO
  const [ordenColumna, setOrdenColumna] = useState("litros_totales"); // Por defecto ordenar por Consumo Total
  const [direccionOrden, setDireccionOrden] = useState("desc"); // Por defecto descendente (mayor a menor)

   // ✅ FUNCIÓN: Formatear fecha con hora en formato dd-mm-yyyy
  const formatearFechaHora = (fecha, hora) => {
    if (!fecha) return fecha;
    if (!hora) return fecha;
    
    // Convertir fecha de yyyy-mm-dd a dd-mm-yyyy
    const fechaFormateada = formatearFecha(fecha);
    return `${fechaFormateada} ${hora}:00`;
  };

  // 🆕 FUNCIÓN AUXILIAR: Convertir fecha a formato dd-mm-yyyy
  const formatearFecha = (fecha) => {
    if (!fecha) return fecha;
    
    // Si la fecha ya está en formato dd-mm-yyyy, devolverla tal como está
    if (fecha.includes('-') && fecha.split('-')[0].length === 2) {
      return fecha;
    }
    
    // Si está en formato yyyy-mm-dd, convertirla
    const partes = fecha.split('-');
    if (partes.length === 3) {
      const [año, mes, dia] = partes;
      return `${dia}-${mes}-${año}`;
    }
    
    return fecha; // Si no es un formato reconocido, devolver tal como está
  };

  // 🆕 FUNCIÓN PARA MANEJAR EL ORDENAMIENTO
  const manejarOrdenamiento = (columna) => {
    if (ordenColumna === columna) {
      // Si es la misma columna, cambiar dirección
      setDireccionOrden(direccionOrden === "asc" ? "desc" : "asc");
    } else {
      // Si es nueva columna, ordenar descendente por defecto
      setOrdenColumna(columna);
      setDireccionOrden("desc");
    }
  };

  // 🆕 FUNCIÓN PARA ORDENAR LOS DATOS
  const ordenarDatos = (datos) => {
    return [...datos].sort((a, b) => {
      let valorA, valorB;

      switch (ordenColumna) {
        case "nombre_maquina":
          valorA = a.nombre_maquina?.toLowerCase() || "";
          valorB = b.nombre_maquina?.toLowerCase() || "";
          break;
        case "categoria":
          valorA = a.categoria?.toLowerCase() || "";
          valorB = b.categoria?.toLowerCase() || "";
          break;
        case "faena":
          valorA = a.faena?.toLowerCase() || "";
          valorB = b.faena?.toLowerCase() || "";
          break;
        case "litros_totales":
          valorA = a.litros_totales || 0;
          valorB = b.litros_totales || 0;
          break;
        case "precio_promedio_litro":
          valorA = a.precio_promedio_litro || 0;
          valorB = b.precio_promedio_litro || 0;
          break;
        case "valor_total":
          valorA = a.valor_total || 0;
          valorB = b.valor_total || 0;
          break;
        case "rendimiento":
          valorA = a.rendimiento?.valor || 0;
          valorB = b.rendimiento?.valor || 0;
          break;
        case "porcentaje_confirmado":
          valorA = a.porcentaje_confirmado || 0;
          valorB = b.porcentaje_confirmado || 0;
          break;
        default:
          return 0;
      }

      // Comparación
      if (typeof valorA === "string") {
        const resultado = valorA.localeCompare(valorB);
        return direccionOrden === "asc" ? resultado : -resultado;
      } else {
        const resultado = valorA - valorB;
        return direccionOrden === "asc" ? resultado : -resultado;
      }
    });
  };

  // 🆕 COMPONENTE PARA ICONO DE ORDENAMIENTO
  const IconoOrdenamiento = ({ columna }) => {
    if (ordenColumna !== columna) {
      return <span className="text-gray-400 ml-1">↕</span>;
    }
    return direccionOrden === "asc" ? (
      <FiChevronUp className="inline ml-1 text-blue-600" />
    ) : (
      <FiChevronDown className="inline ml-1 text-blue-600" />
    );
  };

  // Cargar datos del ConsumoCategoriasController
  const cargarDatosConsumoCategoria = async () => {
    try {
      setLoading(true);
      setError(null);

      const fechaInicioFormateada = formatearFechaHora(fechaDesde, horaDesde);
      const fechaFinFormateada = formatearFechaHora(fechaHasta, horaHasta);

      console.log("🕐 Enviando fechas con hora al backend:", {
        fecha_inicio: fechaInicioFormateada,
        fecha_fin: fechaFinFormateada,
        original_desde: fechaDesde,
        original_hasta: fechaHasta,
        hora_desde: horaDesde,
        hora_hasta: horaHasta,
      });

      const response = await axios.post("/api/consumo-categorias/calcular", {
        fecha_inicio: fechaInicioFormateada,
        fecha_fin: fechaFinFormateada,
        id_faena:
          faenaSeleccionada !== "todas" ? parseInt(faenaSeleccionada) : null,
        incluir_simulacion: true,
        usar_fechas_automaticas: false,
        incluir_sabados: true,
        incluir_domingos: false,
      });

      console.log("✅ Respuesta del backend:", response.data);

      if (!response.data?.success) {
        throw new Error("Error en respuesta del ConsumoCategoriasController");
      }

      // Extraer máquinas del análisis por categoría
      const maquinasData = [];

      if (response.data.analisis_por_categoria) {
        response.data.analisis_por_categoria.forEach((categoria) => {
          if (categoria.analisis_detallado) {
            categoria.analisis_detallado.forEach((maquinaAnalisis) => {
              const maquina = maquinaAnalisis.maquina;
              const resumen = maquinaAnalisis.resumen_ejecutivo;
              const costos = maquinaAnalisis.costos;
              const rendimiento = maquinaAnalisis.rendimiento;

              maquinasData.push({
                // Datos básicos de la máquina
                id_maquina: maquina.id,
                nombre_maquina: maquina.nombre,
                patente: maquina.patente,
                categoria: categoria.categoria.nombre,
                tipo_medicion: categoria.categoria.tipo_medicion,
                faena: maquina.faena?.nombre || "N/A",

                // Datos de consumo
                litros_confirmados: resumen.litros_confirmados || 0,
                litros_simulados: resumen.litros_simulados || 0,
                litros_totales: resumen.litros_totales || 0,
                porcentaje_confirmado: resumen.porcentaje_confirmado || 0,

                // Datos de costos
                precio_promedio_litro: costos.precio_promedio_litro || 0,
                valor_total: costos.valor_total || 0,
                costo_por_dia: costos.costo_por_dia || 0,

                // Datos de rendimiento
                rendimiento: {
                  valor: rendimiento.rendimiento_valor || 0,
                  unidad:
                    rendimiento.tipo_medicion === "Horometro" ? "hr" : "km",
                  formateado: rendimiento.rendimiento_formateado || "N/A",
                  interpretacion: rendimiento.interpretacion || "No disponible",
                },

                // Estadísticas
                estadisticas: maquinaAnalisis.estadisticas || null,
                periodos_confirmados:
                  maquinaAnalisis.periodos_confirmados || [],
                simulacion: maquinaAnalisis.simulacion || null,

                // Metadata
                categoria_completa: categoria,
                analisis_completo: maquinaAnalisis,
              });
            });
          }
        });
      }

      setDatosConsumo(maquinasData);
      setResumenGeneral(response.data.resumen_ejecutivo);

      console.log(
        "✅ Datos ConsumoCategoriasController cargados con horarios:",
        {
          maquinas: maquinasData.length,
          periodo: `${fechaInicioFormateada} - ${fechaFinFormateada}`,
          resumen: response.data.resumen_ejecutivo,
        }
      );
    } catch (err) {
      console.error("Error al cargar datos ConsumoCategoriasController:", err);
      setError("Error al cargar datos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fechaDesde && fechaHasta && horaDesde && horaHasta) {
      cargarDatosConsumoCategoria();
    }
  }, [
    fechaDesde,
    fechaHasta,
    horaDesde,
    horaHasta,
    faenaSeleccionada,
    refreshKey,
  ]);

  // Funciones auxiliares para colores
  const getColorPrecision = (precision) => {
    if (precision >= 80) return "text-green-600 bg-green-50";
    if (precision >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getColorRendimiento = (interpretacion) => {
    if (!interpretacion || interpretacion === "No disponible")
      return "text-gray-500";
    if (interpretacion.includes("eficiente") || interpretacion.includes("bajo"))
      return "text-green-600";
    if (
      interpretacion.includes("moderado") ||
      interpretacion.includes("normal")
    )
      return "text-yellow-600";
    return "text-red-600";
  };

  const getBadgeRendimiento = (interpretacion) => {
    if (!interpretacion || interpretacion === "No disponible")
      return "bg-gray-100 text-gray-600";
    if (interpretacion.includes("eficiente") || interpretacion.includes("bajo"))
      return "bg-green-100 text-green-800";
    if (
      interpretacion.includes("moderado") ||
      interpretacion.includes("normal")
    )
      return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // 🆕 APLICAR ORDENAMIENTO A LOS DATOS
  const datosOrdenados = ordenarDatos(datosConsumo);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <FiLoader className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" />
        <p className="text-gray-600">
          Cargando análisis de consumo por máquina...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <FiAlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={cargarDatosConsumoCategoria}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (datosConsumo.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <FiInfo className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">
          No hay datos de consumo disponibles para el período seleccionado.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiDollarSign className="h-5 w-5 mr-2 text-purple-500" />
              Análisis por Máquina - ConsumoCategoriasController
<span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Ordenado por:{" "}
              {ordenColumna === "litros_totales"
                ? "Consumo Total"
                : ordenColumna === "nombre_maquina"
                ? "Máquina"
                : ordenColumna === "categoria"
                ? "Categoría"
                : ordenColumna === "faena"
                ? "Faena"
                : ordenColumna === "precio_promedio_litro"
                ? "Precio específico"
                : ordenColumna === "valor_total"
                ? "Valor Total"
                : ordenColumna === "rendimiento"
                ? "Rendimiento"
                : ordenColumna === "porcentaje_confirmado"
                ? "Precisión"
                : ordenColumna}
              {direccionOrden === "desc" ? " ↓" : " ↑"}
            </span>

            </h3>
            

            <p className="text-sm text-gray-600 mt-1 flex items-center">
              <FiClock className="h-4 w-4 mr-1 text-blue-500" />
              Filtrado con precisión horaria:{" "}
              {formatearFechaHora(fechaDesde, horaDesde)} hasta {formatearFechaHora(fechaHasta, horaHasta)}

            </p>
          </div>

          {/* Estadísticas del resumen ejecutivo */}
          {resumenGeneral && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-lg font-bold text-blue-600">
                  {resumenGeneral.consumo_total.litros}L
                </div>
                <div className="text-xs text-gray-500">Total Consumo</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-lg font-bold text-green-600">
                  {resumenGeneral.consumo_total.porcentaje_confirmado}%
                </div>
                <div className="text-xs text-gray-500">Confirmado</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-lg font-bold text-purple-600">
                  $
                  {Math.round(
                    resumenGeneral.costo_estimado.total
                  ).toLocaleString("es-CL")}
                </div>
                <div className="text-xs text-gray-500">Costo Total</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-lg font-bold text-orange-600">
                  ${resumenGeneral.costo_estimado.precio_promedio_litro}
                </div>
                <div className="text-xs text-gray-500">Precio Prom.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* 🆕 HEADERS CLICKEABLES CON ICONOS DE ORDENAMIENTO */}
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => manejarOrdenamiento("nombre_maquina")}
              >
                <div className="flex items-center">
                  Máquina
                  <IconoOrdenamiento columna="nombre_maquina" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => manejarOrdenamiento("categoria")}
              >
                <div className="flex items-center">
                  Categoría
                  <IconoOrdenamiento columna="categoria" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => manejarOrdenamiento("faena")}
              >
                <div className="flex items-center">
                  Faena
                  <IconoOrdenamiento columna="faena" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => manejarOrdenamiento("litros_totales")}
              >
                <div className="flex items-center justify-end">
                  Consumo Total
                  <IconoOrdenamiento columna="litros_totales" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => manejarOrdenamiento("precio_promedio_litro")}
              >
                <div className="flex items-center justify-end">
                  Precio Específico
                  <IconoOrdenamiento columna="precio_promedio_litro" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => manejarOrdenamiento("valor_total")}
              >
                <div className="flex items-center justify-end">
                  Valor Total
                  <IconoOrdenamiento columna="valor_total" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => manejarOrdenamiento("rendimiento")}
              >
                <div className="flex items-center justify-end">
                  Rendimiento
                  <IconoOrdenamiento columna="rendimiento" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => manejarOrdenamiento("porcentaje_confirmado")}
              >
                <div className="flex items-center justify-center">
                  Precisión
                  <IconoOrdenamiento columna="porcentaje_confirmado" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* 🆕 USAR DATOS ORDENADOS */}
            {datosOrdenados.map((maquina, index) => (
              <tr
                key={`${maquina.id_maquina}-${index}`}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Columna Máquina */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="font-medium text-gray-900">
                      {maquina.nombre_maquina}
                    </div>
                    <div className="text-sm text-gray-500">
                      {maquina.patente}
                    </div>
                    <div className="text-xs text-gray-400">
                      ID: {maquina.id_maquina}
                    </div>
                  </div>
                </td>

                {/* Columna Categoría */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        maquina.tipo_medicion === "Horometro"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {maquina.tipo_medicion}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {maquina.categoria}
                    </div>
                  </div>
                </td>

                {/* Columna Faena */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {maquina.faena}
                  </div>
                </td>

                {/* Columna Consumo Total */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-bold text-gray-900">
                      {maquina.litros_totales.toLocaleString("es-CL", {
                        maximumFractionDigits: 1,
                      })}
                      L
                    </div>
                    <div className="text-xs text-gray-500">
                      {maquina.litros_confirmados > 0 && (
                        <span className="text-green-600">
                          {maquina.litros_confirmados}L conf.
                        </span>
                      )}
                      {maquina.litros_simulados > 0 && (
                        <span className="text-blue-600 ml-1">
                          +{maquina.litros_simulados}L sim.
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Columna Precio Específico */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-gray-900">
                    ${maquina.precio_promedio_litro.toLocaleString("es-CL")}
                  </div>
                  <div className="text-xs text-gray-500">por litro</div>
                </td>

                {/* Columna Valor Total */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-bold text-gray-900">
                      ${Math.round(maquina.valor_total).toLocaleString("es-CL")}
                    </div>
                    <div className="text-xs text-gray-500">
                      $
                      {Math.round(maquina.costo_por_dia).toLocaleString(
                        "es-CL"
                      )}
                      /día
                    </div>
                  </div>
                </td>

                {/* Columna Rendimiento */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {maquina.rendimiento && maquina.rendimiento.valor > 0 ? (
                    <div className="flex flex-col items-end">
                      <div className="text-sm font-bold text-gray-900">
                        {maquina.rendimiento.formateado}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${getBadgeRendimiento(
                          maquina.rendimiento.interpretacion
                        )}`}
                      >
                        {maquina.rendimiento.interpretacion
                          .replace("Consumo ", "")
                          .replace(" - revisar eficiencia", "")
                          .replace(" - revisar condiciones operativas", "")}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 italic">
                      Sin datos
                    </div>
                  )}
                </td>

                {/* Columna Precisión */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getColorPrecision(
                      maquina.porcentaje_confirmado
                    )}`}
                  >
                    {maquina.porcentaje_confirmado.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {maquina.porcentaje_confirmado >= 80
                      ? "Alta"
                      : maquina.porcentaje_confirmado >= 60
                      ? "Media"
                      : maquina.porcentaje_confirmado > 0
                      ? "Baja"
                      : "Solo simulación"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer con información */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
          <div className="text-sm text-gray-600">
            <span className="font-medium">🎯 Fuente única:</span>
            <span className="ml-1">
              ConsumoCategoriasController - Precios específicos por máquina
            </span>
            <div className="text-xs text-blue-600 mt-1 flex items-center">
              <FiClock className="h-3 w-3 mr-1" />
              Período: {formatearFechaHora(fechaDesde, horaDesde)} -{" "}
              {formatearFechaHora(fechaHasta, horaHasta)}
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>
              <strong>{datosConsumo.length}</strong> máquina
              {datosConsumo.length !== 1 ? "s" : ""} analizadas
            </span>
            <span>•</span>
            <span>
              <strong>
                {datosConsumo.filter((m) => m.porcentaje_confirmado > 0).length}
              </strong>{" "}
              con datos confirmados
            </span>
            <span>•</span>
            <span>
              <strong>
                {datosConsumo.filter((m) => m.litros_simulados > 0).length}
              </strong>{" "}
              con simulación
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsumoPorMaquinaPureTable;
