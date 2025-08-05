import React, { useState, useEffect, useMemo } from "react";
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
  FiFilter,
  FiX,
} from "react-icons/fi";

// Componente de filtro simple para las columnas
const ColumnFilter = ({
  titulo,
  opciones = [],
  valor = "",
  onChange,
  tipo = "select", // "select" o "text"
  onSort,
  ordenColumna,
  direccionOrden,
  columna,
}) => {
  const [mostrarFiltro, setMostrarFiltro] = useState(false);

  const renderIconoOrdenamiento = () => {
    if (ordenColumna !== columna) {
      return <span className="text-gray-400 ml-1">↕</span>;
    }
    return direccionOrden === "asc" ? (
      <FiChevronUp className="inline ml-1 text-blue-600" />
    ) : (
      <FiChevronDown className="inline ml-1 text-blue-600" />
    );
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center cursor-pointer hover:text-blue-600"
          onClick={onSort}
        >
          {titulo}
          {renderIconoOrdenamiento()}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMostrarFiltro(!mostrarFiltro);
          }}
          className={`ml-2 p-1 rounded hover:bg-gray-200 ${
            valor ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <FiFilter size={12} />
        </button>
      </div>

      {mostrarFiltro && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-48">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Filtrar {titulo}
              </span>
              <button
                onClick={() => setMostrarFiltro(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={12} />
              </button>
            </div>

            {tipo === "select" ? (
              <div className="max-h-48 overflow-y-auto">
                <div
                  className={`p-2 text-sm cursor-pointer hover:bg-gray-100 rounded ${
                    valor === "" ? "bg-blue-50 text-blue-600" : ""
                  }`}
                  onClick={() => {
                    onChange("");
                    setMostrarFiltro(false);
                  }}
                >
                  Todos
                </div>
                {opciones.map((opcion, index) => (
                  <div
                    key={index}
                    className={`p-2 text-sm cursor-pointer hover:bg-gray-100 rounded ${
                      valor === opcion ? "bg-blue-50 text-blue-600" : ""
                    }`}
                    onClick={() => {
                      onChange(opcion);
                      setMostrarFiltro(false);
                    }}
                  >
                    {opcion}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={valor}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={`Buscar ${titulo.toLowerCase()}...`}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      onChange("");
                      setMostrarFiltro(false);
                    }}
                    className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={() => setMostrarFiltro(false)}
                    className="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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

  // Estados para ordenamiento (mantener igual)
  const [ordenColumna, setOrdenColumna] = useState("litros_totales");
  const [direccionOrden, setDireccionOrden] = useState("desc");

  // 🆕 Estados para filtros
  const [filtros, setFiltros] = useState({
    maquina: "",
    categoria: "",
    faena: "",
    patente: "",
  });

  // Función para formatear fecha con hora (mantener igual)
  const formatearFechaHora = (fecha, hora) => {
    if (!fecha) return fecha;
    if (!hora) return fecha;

    const fechaFormateada = formatearFecha(fecha);
    return `${fechaFormateada} ${hora}:00`;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return fecha;

    if (fecha.includes("-") && fecha.split("-")[0].length === 2) {
      return fecha;
    }

    const partes = fecha.split("-");
    if (partes.length === 3) {
      const [año, mes, dia] = partes;
      return `${dia}-${mes}-${año}`;
    }

    return fecha;
  };

  // Función para manejar ordenamiento (mantener igual)
  const manejarOrdenamiento = (columna) => {
    if (ordenColumna === columna) {
      setDireccionOrden(direccionOrden === "asc" ? "desc" : "asc");
    } else {
      setOrdenColumna(columna);
      setDireccionOrden("desc");
    }
  };

  // Función para ordenar los datos (mantener igual)
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

      if (typeof valorA === "string") {
        const resultado = valorA.localeCompare(valorB);
        return direccionOrden === "asc" ? resultado : -resultado;
      } else {
        const resultado = valorA - valorB;
        return direccionOrden === "asc" ? resultado : -resultado;
      }
    });
  };

  // 🆕 Función para filtrar datos
  const filtrarDatos = (datos) => {
    return datos.filter((maquina) => {
      const cumpleMaquina =
        !filtros.maquina ||
        maquina.nombre_maquina
          ?.toLowerCase()
          .includes(filtros.maquina.toLowerCase());

      const cumpleCategoria =
        !filtros.categoria || maquina.categoria === filtros.categoria;

      const cumpleFaena = !filtros.faena || maquina.faena === filtros.faena;

      const cumplePatente =
        !filtros.patente ||
        maquina.patente?.toLowerCase().includes(filtros.patente.toLowerCase());

      return cumpleMaquina && cumpleCategoria && cumpleFaena && cumplePatente;
    });
  };

  // 🆕 Generar opciones únicas para los filtros select
  const opcionesFiltros = useMemo(() => {
    const maquinas = [
      ...new Set(datosConsumo.map((m) => m.nombre_maquina).filter(Boolean)),
    ].sort();
    const categorias = [
      ...new Set(datosConsumo.map((m) => m.categoria).filter(Boolean)),
    ].sort();
    const faenas = [
      ...new Set(datosConsumo.map((m) => m.faena).filter(Boolean)),
    ].sort();

    return { maquinas, categorias, faenas };
  }, [datosConsumo]);

  // 🆕 Aplicar filtros y ordenamiento
  const datosProcesados = useMemo(() => {
    const datosFiltrados = filtrarDatos(datosConsumo);
    return ordenarDatos(datosFiltrados);
  }, [datosConsumo, filtros, ordenColumna, direccionOrden]);

  // 🆕 Función para manejar cambios de filtro
  const manejarCambioFiltro = (tipoFiltro, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [tipoFiltro]: valor,
    }));
  };

  // 🆕 Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltros({
      maquina: "",
      categoria: "",
      faena: "",
      patente: "",
    });
  };

  // Cargar datos del ConsumoCategoriasController (mantener igual)
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

                // Datos de rendimiento - VERSIÓN CORREGIDA
                rendimiento: {
                  valor: rendimiento.rendimiento_valor || 0,
                  unidad:
                    rendimiento.tipo_medicion === "Horometro" ? "hr" : "km",
                  formateado: rendimiento.rendimiento_formateado || "N/A",
                  interpretacion: rendimiento.interpretacion || "No disponible",

                  // 🆕 AGREGAR: Información completa de medición
                  medicion_total: rendimiento.medicion_total || {
                    primera_medicion: null,
                    ultima_medicion: null,
                    total_registros: 0,
                    tipo_medicion: categoria.categoria.tipo_medicion,
                    unidad:
                      categoria.categoria.tipo_medicion === "Horometro"
                        ? "h"
                        : "km",
                  },
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

  // Funciones auxiliares para colores (mantener igual)
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

  // Contadores para filtros activos
  const filtrosActivos = Object.values(filtros).filter((f) => f !== "").length;

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
              {filtrosActivos > 0 && (
                <span className="ml-2 text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                  {filtrosActivos} filtro{filtrosActivos !== 1 ? "s" : ""}{" "}
                  activo{filtrosActivos !== 1 ? "s" : ""}
                </span>
              )}
            </h3>

            <p className="text-sm text-gray-600 mt-1 flex items-center">
              <FiClock className="h-4 w-4 mr-1 text-blue-500" />
              Filtrado con precisión horaria:{" "}
              {formatearFechaHora(fechaDesde, horaDesde)} hasta{" "}
              {formatearFechaHora(fechaHasta, horaHasta)}
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

      {/* 🆕 Barra de filtros activos */}
      {filtrosActivos > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-blue-700">
              Filtros activos:
            </span>
            {filtros.maquina && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                Máquina: {filtros.maquina}
                <button
                  onClick={() => manejarCambioFiltro("maquina", "")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <FiX size={12} />
                </button>
              </span>
            )}
            {filtros.categoria && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                Categoría: {filtros.categoria}
                <button
                  onClick={() => manejarCambioFiltro("categoria", "")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <FiX size={12} />
                </button>
              </span>
            )}
            {filtros.faena && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                Faena: {filtros.faena}
                <button
                  onClick={() => manejarCambioFiltro("faena", "")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <FiX size={12} />
                </button>
              </span>
            )}
            {filtros.patente && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                Patente: {filtros.patente}
                <button
                  onClick={() => manejarCambioFiltro("patente", "")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <FiX size={12} />
                </button>
              </span>
            )}
            <button
              onClick={limpiarFiltros}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Limpiar todos
            </button>
          </div>
        </div>
      )}

      {/* Tabla con filtros en headers */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* 🆕 Header con filtro para Máquina */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <ColumnFilter
                  titulo="Máquina"
                  tipo="text"
                  valor={filtros.maquina}
                  onChange={(valor) => manejarCambioFiltro("maquina", valor)}
                  onSort={() => manejarOrdenamiento("nombre_maquina")}
                  ordenColumna={ordenColumna}
                  direccionOrden={direccionOrden}
                  columna="nombre_maquina"
                />
              </th>

              {/* 🆕 Header con filtro para Categoría */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <ColumnFilter
                  titulo="Categoría"
                  tipo="select"
                  opciones={opcionesFiltros.categorias}
                  valor={filtros.categoria}
                  onChange={(valor) => manejarCambioFiltro("categoria", valor)}
                  onSort={() => manejarOrdenamiento("categoria")}
                  ordenColumna={ordenColumna}
                  direccionOrden={direccionOrden}
                  columna="categoria"
                />
              </th>

              {/* 🆕 Header con filtro para Faena */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <ColumnFilter
                  titulo="Faena"
                  tipo="select"
                  opciones={opcionesFiltros.faenas}
                  valor={filtros.faena}
                  onChange={(valor) => manejarCambioFiltro("faena", valor)}
                  onSort={() => manejarOrdenamiento("faena")}
                  ordenColumna={ordenColumna}
                  direccionOrden={direccionOrden}
                  columna="faena"
                />
              </th>

              {/* Headers sin filtro pero con ordenamiento */}
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => manejarOrdenamiento("litros_totales")}
              >
                <div className="flex items-center justify-end">
                  Consumo Total
                  {ordenColumna === "litros_totales" ? (
                    direccionOrden === "asc" ? (
                      <FiChevronUp className="inline ml-1 text-blue-600" />
                    ) : (
                      <FiChevronDown className="inline ml-1 text-blue-600" />
                    )
                  ) : (
                    <span className="text-gray-400 ml-1">↕</span>
                  )}
                </div>
              </th>

              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => manejarOrdenamiento("precio_promedio_litro")}
              >
                <div className="flex items-center justify-end">
                  Precio Específico
                  {ordenColumna === "precio_promedio_litro" ? (
                    direccionOrden === "asc" ? (
                      <FiChevronUp className="inline ml-1 text-blue-600" />
                    ) : (
                      <FiChevronDown className="inline ml-1 text-blue-600" />
                    )
                  ) : (
                    <span className="text-gray-400 ml-1">↕</span>
                  )}
                </div>
              </th>

              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => manejarOrdenamiento("valor_total")}
              >
                <div className="flex items-center justify-end">
                  Valor Total
                  {ordenColumna === "valor_total" ? (
                    direccionOrden === "asc" ? (
                      <FiChevronUp className="inline ml-1 text-blue-600" />
                    ) : (
                      <FiChevronDown className="inline ml-1 text-blue-600" />
                    )
                  ) : (
                    <span className="text-gray-400 ml-1">↕</span>
                  )}
                </div>
              </th>

              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => manejarOrdenamiento("rendimiento")}
              >
                <div className="flex items-center justify-end">
                  Rendimiento
                  {ordenColumna === "rendimiento" ? (
                    direccionOrden === "asc" ? (
                      <FiChevronUp className="inline ml-1 text-blue-600" />
                    ) : (
                      <FiChevronDown className="inline ml-1 text-blue-600" />
                    )
                  ) : (
                    <span className="text-gray-400 ml-1">↕</span>
                  )}
                </div>
              </th>

              <th
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => manejarOrdenamiento("porcentaje_confirmado")}
              >
                <div className="flex items-center justify-center">
                  Precisión
                  {ordenColumna === "porcentaje_confirmado" ? (
                    direccionOrden === "asc" ? (
                      <FiChevronUp className="inline ml-1 text-blue-600" />
                    ) : (
                      <FiChevronDown className="inline ml-1 text-blue-600" />
                    )
                  ) : (
                    <span className="text-gray-400 ml-1">↕</span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Usar datos procesados (filtrados y ordenados) */}
            {datosProcesados.map((maquina, index) => (
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
                        {/* 🆕 CATEGORÍA EN GRIS (ABAJO) */}
                    <div className="text-xs text-gray-500 text-left">
                      {maquina.categoria}
                    </div>
                    
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-2">
                    {/* 🆕 TIPO DE MEDICIÓN CON FONDO DE COLOR (ARRIBA) */}
                    <div>
                      {maquina.tipo_medicion === "Horometro" ? (
                        <span className="px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          
                          Horómetro:{" "}
                          {maquina.rendimiento?.medicion_total?.ultima_medicion
                            ? Number(
                                maquina.rendimiento.medicion_total
                                  .ultima_medicion
                              ).toLocaleString()
                            : "N/A"}{" "}
                          hrs
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          
                          Kilometraje:{" "}
                          {maquina.rendimiento?.medicion_total?.ultima_medicion
                            ? Number(
                                maquina.rendimiento.medicion_total
                                  .ultima_medicion
                              ).toLocaleString()
                            : "N/A"}{" "}
                          km
                        </span>
                      )}
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

      {/* Footer con información actualizada */}
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
              <strong>{datosProcesados.length}</strong> de{" "}
              <strong>{datosConsumo.length}</strong> máquina
              {datosConsumo.length !== 1 ? "s" : ""} mostrada
              {datosProcesados.length !== 1 ? "s" : ""}
            </span>
            {filtrosActivos > 0 && (
              <>
                <span>•</span>
                <span className="text-orange-600">
                  <strong>{filtrosActivos}</strong> filtro
                  {filtrosActivos !== 1 ? "s" : ""} activo
                  {filtrosActivos !== 1 ? "s" : ""}
                </span>
              </>
            )}
            <span>•</span>
            <span>
              <strong>
                {
                  datosProcesados.filter((m) => m.porcentaje_confirmado > 0)
                    .length
                }
              </strong>{" "}
              con datos confirmados
            </span>
            <span>•</span>
            <span>
              <strong>
                {datosProcesados.filter((m) => m.litros_simulados > 0).length}
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
